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

## 部署流程

项目虽用 Vue 构建，但部署到 GitHub Pages 的是 `docs/` 下纯静态文件。**只有改源码（`.vue`/`.js`/`.css`）才需要构建；改数据（标记/分类/区域）直接改 `docs/data/` 即可。**

### 只改标记数据（推荐，无需构建）

标记是纯 JSON 文件，浏览器直接 fetch，不经过 Vite 编译。

```powershell
# 1. 编辑标记（两个文件同步修改）
#    docs/data/markers.json      ← 线上实际使用的文件
#    public/data/markers.json    ← 源文件，保持同步

# 2. 审查
npm run verify

# 3. 推送
git add docs/data/markers.json public/data/markers.json
git commit -m "deploy: 更新标记 — xxx"
git push
```

**不需要 `npm run build`，不需要复制瓦片。推送即上线。**

> 原则：`docs/` 和 `public/` 下的同名数据文件必须保持同步。`public/` 是源，`docs/` 是部署目标。

### 改源码（Vue/JS/CSS）

只有改 `.vue`、`src/` 下 JS、`style.css`、路由等才需要完整构建。

```powershell
npm run build      # clean-docs → vite build → copy-tiles(仅瓦片变化时)
npm run verify     # 审查（不通过禁止推送）
git add -A
git commit -m "feat: xxx"
git push
```

### 构建说明

- `vite build` 输出到 `docs/`，`emptyOutDir: false` 不清空
- `clean-docs.js` 构建前清理 `docs/` 但**保留 `TileMap/`**
- `copy-tiles.js` 通过 `.tilemap-stamp` 时间戳判断，瓦片无变化时跳过（171MB 不复制）
- 日常改数据构建完全不需要，改源码构建约 2 秒

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
