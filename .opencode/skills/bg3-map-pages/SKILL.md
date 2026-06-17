---
name: bg3-map-pages
description: BG3 交互式地图静态站点 — 基于 Vue3+Leaflet 的 GitHub Pages 部署版本。原作者仓库 G:\BG3_map，部署仓库 G:\Map_Pages，线上地址 https://beginandend123.github.io/Map_Pages/。触发条件：修改地图标记/瓦片/分类/区域、新增地图章节、修复前端 bug、重新部署。
---

# BG3 交互式地图 — GitHub Pages 静态版本

## 概述

[线上地址](https://beginandend123.github.io/Map_Pages/) | [GitHub 仓库](https://github.com/BeginAndEnd123/Map_Pages)

博德之门 3 全章节交互式地图，基于 Leaflet + CRS.Simple 瓦片渲染。原项目为 FastAPI+Vue3+MySQL 全栈应用，已改造为纯静态站点部署于 GitHub Pages。

**管理员密码**：`admin123`（SHA-256 校验，在 NavBar 顶部输入）

> 详细运作原理见 **[PROJECT_ARCHITECTURE.md](./PROJECT_ARCHITECTURE.md)** — 数据流、组件协作、Leaflet 渲染、CRUD 机制等。

## 技术架构

| 层面 | 技术 | 说明 |
|------|------|------|
| 框架 | Vue 3 (Composition API) | SPA |
| 路由 | Vue Router (Hash 模式) | `createWebHashHistory` |
| 状态管理 | Pinia | `auth` store + `map` store |
| 地图引擎 | Leaflet 1.9 | CRS.Simple 坐标系 |
| 构建工具 | Vite 5 | `base: '/Map_Pages/'`, `outDir: 'docs'` |
| 数据存储 | localStorage + 静态 JSON | 管理员修改本地持久化 |
| 部署 | GitHub Pages (master 分支 /docs) | 单分支部署 |

## 仓库结构

```
G:\Map_Pages\                       # 部署仓库（master 单分支）
├── index.html                      # SPA 入口
├── package.json                    # vue/vue-router/pinia/leaflet
├── vite.config.js                  # base: '/Map_Pages/', outDir: 'docs'
├── public/                         # 静态资源
│   ├── data/                       # regions.json / categories.json / markers.json / maps_index.json
│   └── icons/                     # 分类图标 SVG
├── TileMap/                        # WebP 瓦片（zoom 1-6, ~171MB）
├── docs/                           # ★ 构建产物 = GitHub Pages 站点根目录
├── src/                            # 源码
│   ├── main.js                     # Vue 入口
│   ├── App.vue                     # 根组件
│   ├── style.css                   # 全局样式（暗色金边主题）
│   ├── router/index.js             # Hash 路由
│   ├── data/                       # ★ 纯函数数据层
│   │   ├── index.js                # 统一导出
│   │   ├── sources.js              # fetch JSON + 缓存
│   │   ├── storage.js              # localStorage 封装
│   │   ├── merge.js                # JSON+localStorage 合并
│   │   ├── auth.js                 # SHA-256 登录
│   │   └── crud.js                 # 本地增删改
│   ├── stores/
│   │   ├── auth.js                 # 认证状态 (Pinia)
│   │   └── map.js                  # 地图数据状态 (Pinia)
│   ├── composables/                # 6 个组合式函数
│   │   ├── useMapNavigation.js     # 章节/地图切换
│   │   ├── useMarkerSearch.js      # 全局搜索
│   │   ├── useRecentMarkers.js     # 最新标记分页
│   │   ├── useMarkerForm.js        # 标记表单提交
│   │   ├── usePickMode.js          # 坐标拾取
│   │   └── useSidebar.js           # 侧边栏开关
│   ├── components/                 # 8 个组件
│   │   ├── NavBar.vue              # 顶部导航（管理员入口）
│   │   ├── MapContainer.vue        # Leaflet 地图
│   │   ├── MapSidebar.vue          # 侧边栏（章节/搜索/标记列表）
│   │   ├── SidePanel.vue           # 侧边栏容器（响应式）
│   │   ├── MarkerPopup.vue         # 标记悬浮卡
│   │   ├── MarkerForm.vue          # 标记表单
│   │   ├── CategoryManager.vue     # 分类管理
│   │   └── RegionManager.vue       # 区域管理
│   └── views/
│       ├── HomeView.vue            # 主页（编排者）
│       └── NotFoundView.vue        # 404
├── scripts/
│   ├── copy-tiles.js               # 构建后复制瓦片
│   ├── check-tiles.js              # 源瓦片完整性检查
│   └── verify-deploy.js            # ★ 部署前审查 — 检查 docs/ 完整性
└── screenshots/                    # 标记截图
```

## 数据层（`src/data/`）

原 300+ 行的 `loader.js` 已拆分为 6 个模块：

| 模块 | 类型 | 职责 |
|------|------|------|
| `sources.js` | 异步 | fetch JSON + 内存缓存 + `BASE` URL 拼接 |
| `storage.js` | 同步 | localStorage 读写封装 |
| `merge.js` | 纯函数 | JSON 基准 + localStorage 修改 → 合并 |
| `auth.js` | 异步+同步 | SHA-256 登录 |
| `crud.js` | 同步 | 本地 CRUD（增删改写入 localStorage） |
| `index.js` | Barrel | 统一对外 API |

**核心公式**：`mergeData(jsonArr, localStorageMods)` → 最终数据

### localStorage 存储键

| 键 | 内容 |
|----|------|
| `bg3_admin_auth` | `"true"` / `null` |
| `bg3_admin_user` | `{ username:"admin", is_admin:true }` |
| `bg3_mod_markers` | `{ additions:[], edits:{}, deletions:[] }` |
| `bg3_mod_categories` | 同上 |
| `bg3_mod_regions` | 同上 |

## 5 个章节

| 章节 | chapter key | 区域 ID |
|------|------------|---------|
| 序章（鹦鹉螺式魔法船） | `chapter0` | 1 |
| 第1章（林地/地精营地/幽暗地域） | `chapter1` | 2 |
| 第1.5章（伊雷珂养育间） | `chapter2` | 3 |
| 第2章（幽影诅咒之地/月出之塔） | `chapter3` | 4 |
| 第3章（博德之门） | `chapter4` | 5 |

## 构建与部署

### 重要：Windows PowerShell 5.1 不支持 `&&`

`package.json` 的 build 脚本必须使用 PowerShell 兼容的分号+条件语法：

```json
"build": "vite build; if ($?) { node scripts/copy-tiles.js }"
```

> 如果使用 `&&`，在 PowerShell 5.1 中 `&&` 后面的 `copy-tiles.js` 不会执行，导致 `docs/TileMap/` 缺失——地图瓦片全部 404，但标记仍正常渲染。

### 构建（必须完整执行两步）

```powershell
npm run build
# 1. vite build → docs/（JS/CSS/HTML + public/ 下静态资源）
# 2. node scripts/copy-tiles.js → docs/TileMap/（~171MB WebP 瓦片）
```

构建成功标志：`docs/TileMap/` 目录存在且有 `chapter0/` ~ `chapter4/` 子目录。

### 部署前审查（必须通过！）

**推送前必须运行审查脚本：**

```powershell
npm run verify
# 等价于: node scripts/verify-deploy.js
```

审查内容：
1. `docs/index.html` 和 `docs/assets/` 存在
2. `docs/data/` 下 4 个 JSON 文件存在且可解析
3. `docs/TileMap/` 目录存在
4. 对比 `maps_index.json` 检查 97 张地图瓦片完整性
5. `docs/icons/` 和 `docs/screenshots/` 存在

**审查不通过则禁止推送。** 审查通过输出 `审查通过 — 可以安全推送`。

### 完整部署流程

```powershell
# 1. 修改源码（public/data/ 标记数据等）
# 2. 构建
npm run build
# 3. 审查（不通过则回到步骤 2 修复）
npm run verify
# 4. 推送（仅审查通过后）
git add docs/ package.json package-lock.json
git commit -m "deploy: 描述本次变更"
git push
```

GitHub Pages 设置：**Deploy from a branch** → `master` / `/docs`

## 常见问题

| 问题 | 原因 | 解决 |
|------|------|------|
| 页面空白 | `vite.config.js` 中 `base` 路径不对 | 确保 `base: '/Map_Pages/'` |
| 地图无标记 | `public/data/markers.json` 丢失或 `BASE` 拼错 | 检查文件存在 + `sources.js` 中 fetch 路径 |
| **标记正常但瓦片 404** | `docs/TileMap/` 缺失 — `copy-tiles.js` 未执行 | 运行 `node scripts/copy-tiles.js`；检查 build 脚本是否使用 `; if ($?)` 而非 `&&` |
| `npm run build` 后瓦片未复制 | PowerShell 5.1 不支持 `&&` 语法 | 确保 build 脚本为 `"vite build; if ($?) { node scripts/copy-tiles.js }"` |
| 构建失败 `EBUSY` | Windows 文件锁（webp 被其他程序占用） | 关闭资源管理器预览/图片查看器后重试 |
| 管理员登录后无法操作 | `adminUser` 被双重 `JSON.stringify` | 检查 `storage.js` 的 `writeAdminUser` 参数是否为对象 |

## 新增章节流程

1. 在 `TileMap/` 下添加新章节的瓦片目录
2. 修改 `public/data/regions.json` 添加新区块
3. 修改 `public/data/maps_index.json` 添加地图索引
4. 修改 `src/data/sources.js` 的 `CHAPTER_KEYS` 和 `CHAPTER_NAMES`
5. 重新构建部署
