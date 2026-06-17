# BG3 Map Pages 重构计划书

> 基于 `.opencode/audit.md` 审计报告，对项目数据层和视图层进行架构重构。
> 原则：**仅架构清理，功能完全不变。**
> 开始时间：2026-06-17

---

## 目标

| 维度 | 现状 | 目标 |
|------|------|------|
| 数据层文件数 | 1 个 `loader.js` (309行) | 6 个小文件各 <100行 |
| localStorage 数据模型 | `_deleted` 标记混杂 | `{additions, edits, deletions}` 三列表 |
| Pinia stores | 3 个 (map, auth, ui) | 2 个 (map, auth)，ui 删除 |
| HomeView 行数 | 558 行 | ~150 行 |
| 死代码 | onDeleteMarker, 空目录等 | 全部清理 |
| 公共样式 | 无全局组件 class | 提取按钮/表单公共 class |

---

## 新目录结构

```
src/
├── main.js
├── App.vue
├── style.css
│
├── data/                            ★ 新建
│   ├── index.js                     ★ 统一导出
│   ├── storage.js                   ★ localStorage 抽象
│   ├── sources.js                   ★ JSON 加载 + 缓存
│   ├── merge.js                     ★ 纯函数合并
│   ├── auth.js                      ★ 管理员认证
│   └── crud.js                      ★ CRUD 操作
│
├── stores/
│   ├── map.js                       △ 修改（CRUD 改用 data/crud.js）
│   ├── auth.js                      △ 修改（认证改用 data/auth.js）
│   └── ui.js                        ✕ 删除
│
├── composables/
│   ├── useMapNavigation.js          △ 修改引用
│   ├── useMarkerForm.js             △ 清理死代码
│   ├── useMarkerSearch.js
│   ├── usePickMode.js
│   ├── useRecentMarkers.js
│   ├── useSidebar.js                ★ 新建（替代 ui.js）
│   └── useMarkerHoverPreview.js     ★ 新建（从 HomeView 提取）
│
├── components/
│   ├── NavBar.vue                   △ 改用 useSidebar
│   ├── SidePanel.vue
│   ├── MapSidebar.vue               ★ 新建（侧边栏内容）
│   ├── MapContainer.vue
│   ├── MarkerPopup.vue
│   ├── MarkerForm.vue
│   ├── CategoryManager.vue
│   └── RegionManager.vue
│
└── views/
    ├── HomeView.vue                 △ 从 558 行精简到 ~150 行
    └── NotFoundView.vue
```

★ 新建  △ 修改  ✕ 删除

---

## 步骤清单

| # | 步骤 | 说明 | 状态 |
|---|------|------|------|
| 1 | `src/data/storage.js` | localStorage 读写抽象，新数据模型 | ✅ |
| 2 | `src/data/sources.js` | JSON 加载 + 内存缓存 | ✅ |
| 3 | `src/data/merge.js` | 纯函数合并（无 _deleted） | ✅ |
| 4 | `src/data/auth.js` | SHA-256 管理员认证 | ✅ |
| 5 | `src/data/crud.js` | 标记/分类/区域 CRUD 操作 | ✅ |
| 6 | `src/data/index.js` | 统一导出入口 | ✅ |
| 7 | 重构 stores + composables | 切换所有依赖到新 data 层 + 创建 useSidebar | ✅ |
| 8 | MapSidebar.vue + 精简 HomeView | 提取侧边栏为独立组件 | ✅ |
| 9 | 提取公共样式 | style.css 添加 .btn-gold / .btn-outline / .form-input / .form-select / .form-label / .overlay / .dialog-card | ✅ |
| 10 | 清理 + 验证构建 | 删除 ui.js、loader.js，npm run build 通过，69 模块编译成功 | ✅ |

---

## 数据层新设计

### localStorage 数据模型

**旧模型**（废弃）：
```json
// 同一 key 混杂新增/修改/删除
[{ "id": 1, "name": "...", "_deleted": true }, ...]
```

**新模型**：
```json
// 分类存储，语义清晰
{
  "additions": [ { "id": 230, ... } ],
  "edits": { "230": { "name": "新名字" } },
  "deletions": [230]
}
```

每个数据类型（regions/categories/markers）一个独立的 localStorage key：
- `bg3_mod_regions`
- `bg3_mod_categories`
- `bg3_mod_markers`

### 合并策略

```
merge(jsonData, modifications):
  1. JSON 数据作为基线
  2. 应用 edits 覆盖同 ID 字段
  3. 追加 additions 中的新增项
  4. 过滤 deletions 中的 ID
  5. 返回最终数组
```

不再有 `_deleted` 标记，不再需要判断「是否有原始 local 项」。

---

## 变更记录

| 时间 | 步骤 | 变更 |
|------|------|------|
| 2026-06-17 | 全部 | 重构完成。新建 8 文件，修改 12 文件，删除 2 文件。Vite build 通过 (69 modules, 1 JS + 1 CSS)。 |
