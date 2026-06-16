---
name: bg3-map-pages
description: BG3 交互式地图静态站点 — 基于 Vue3+Leaflet 的 GitHub Pages 部署版本。原作者仓库 G:\BG3_map，部署仓库 G:\Map_Pages，线上地址 https://beginandend123.github.io/Map_Pages/。触发条件：修改地图标记/瓦片/分类/区域、新增地图章节、修复前端 bug、重新部署。
---

# BG3 交互式地图 — GitHub Pages 静态版本

## 概述

[线上地址](https://beginandend123.github.io/Map_Pages/) | [GitHub 仓库](https://github.com/BeginAndEnd123/Map_Pages)

博德之门 3 全章节交互式地图，基于 Leaflet + CRS.Simple 瓦片渲染。原项目为 FastAPI+Vue3+MySQL 全栈应用，已改造为纯静态站点部署于 GitHub Pages。

**管理员密码**: `admin123`（SHA-256 校验，在 NavBar 顶部输入）

## 技术架构

| 层面 | 技术 | 说明 |
|------|------|------|
| 框架 | Vue 3 (Composition API) | SPA |
| 路由 | Vue Router (Hash 模式) | `createWebHashHistory` |
| 状态管理 | Pinia | auth store + map store |
| 地图引擎 | Leaflet 1.9 | CRS.Simple 坐标系 |
| 构建工具 | Vite 5 | `base: '/Map_Pages/'` |
| 数据存储 | localStorage + 静态 JSON | 管理员修改本地持久化 |
| 部署 | GitHub Pages (gh-pages 分支) | HTTPS 推送 |

## 仓库结构（G:\Map_Pages）

```
G:\Map_Pages/                  # 工作目录（部署仓库）
├── index.html                 # SPA 入口（gh-pages 分支）
├── assets/                    # 构建产物 JS/CSS（gh-pages）
├── data/                      # 静态数据 JSON（gh-pages）
│   ├── regions.json           # 5 个章节区域
│   ├── categories.json        # 4 种标记分类
│   ├── markers.json           # 已审核标记数据
│   └── maps_index.json        # 各章节地图列表+tile_url
├── icons/                     # 分类图标 SVG
├── screenshots/               # 标记截图
├── TileMap/                   # WebP 瓦片（zoom 1-6，~90,388 文件，~171MB）
├── src/                       # 源码（master 分支）
│   ├── main.js                # Vue 入口
│   ├── router/index.js        # Hash 路由
│   ├── data/loader.js         # 静态数据加载+localStorage 合并引擎 ★
│   ├── stores/
│   │   ├── auth.js            # 管理员认证（SHA-256）
│   │   └── map.js             # 地图数据状态
│   ├── composables/           # 6 个组合式函数
│   ├── components/            # 9 个 Vue 组件
│   └── views/
│       ├── HomeView.vue       # 主页（地图+侧边栏）
│       └── NotFoundView.vue   # 404
├── public/                    # 静态资源（构建时复制到 dist/）
│   └── TileMap/               # 瓦片（.gitignore 排除，构建时从 gh-pages 恢复）
├── vite.config.js             # base: '/Map_Pages/'
└── package.json               # vue/vue-router/pinia/leaflet
```

## 分支策略

| 分支 | 内容 | 说明 |
|------|------|------|
| `master` | 源码 | Vue 组件、构建配置，不含 TileMap |
| `gh-pages` | 构建产物 | dist 目录内容（HTML+JS+CSS+数据+瓦片） |

GitHub Pages Source 设置：`gh-pages` / `(root)`

## 核心改造要点

### 1. 路由 → Hash 模式
`src/router/index.js`: `createWebHashHistory()` 替代 `createWebHistory()`

### 2. 数据加载 → loader.js
`src/data/loader.js` 是改造核心，负责：
- `fetchJSON(BASE + path)` 加载 JSON 数据
- localStorage 合并（localStorage 覆盖 JSON）
- 管理员登录（SHA-256）、本地 CRUD
- **`BASE` 变量**：`import.meta.env.BASE_URL` → 构建时替换为 `/Map_Pages/`

### 3. 瓦片处理
- 原 PNG 瓦片 → WebP（质量 85%），171MB
- 排除 zoom_7 级别（仅 1 张地图有，省 218MB）
- 转换脚本：`tile_convert.py`，从 `G:\BG3_map\TileMap` 读取原图

### 4. 管理员功能
所有写入操作通过 `localStorage` 持久化：
- `STORAGE_KEYS`: `bg3_admin_auth`, `bg3_admin_user`, `bg3_local_markers`, `bg3_local_regions`, `bg3_local_categories`
- 标记/分类/区域增删改 → `localAdd*` / `localUpdate*` / `localDelete*`
- 图标上传 → FileReader base64 data URL

### 5. 删除的功能
- 用户注册/登录 → 仅保留管理员登录
- 审核面板 → 移除 ReviewModal
- Axios / API 调用 → 全部移除

## 常见问题与修复

### ❌ 页面空白、JS/CSS 404
**原因**：`vite.config.js` 的 `base` 路径与 GitHub Pages 仓库名不匹配。
**检查**：`base` 必须为 `'/Map_Pages/'`（仓库名）。

### ❌ 地图无标记/数据
**原因**：`loader.js` 中 fetch 路径缺少 `BASE` 前缀。
**检查**：所有 `fetchJSON()` 调用都使用 `BASE + 'data/xxx.json'`。

### ❌ 管理员登录后无法添加标记
**原因**：`adminLogin()` 中对 `adminUser` 双写了 `JSON.stringify`，导致 `authStore.user` 拿到字符串而非对象。
```js
// 错误（已修复）
writeLocal(STORAGE_KEYS.adminUser, JSON.stringify({...}))  // writeLocal 会再 stringify 一次

// 正确
writeLocal(STORAGE_KEYS.adminUser, {...})  // 传对象，writeLocal 内部 stringify
```

### ❌ TileMap 瓦片 404
**原因**：瓦片未在 `dist/TileMap/` 中。
**操作**：`git checkout gh-pages -- TileMap/` 恢复瓦片到 `public/TileMap/`，然后 `npm run build`。

## 日常操作

### 修改数据（标记/分类/区域）
1. 以管理员身份登录页面
2. 使用界面上的管理按钮操作（标记添加/编辑、分类管理、区域管理）
3. 数据自动保存到 localStorage，刷新后仍在

### 添加新地图章节
1. 在 `G:\BG3_map\TileMap\` 中添加新章节的瓦片目录
2. 运行 `tile_convert.py` 转换 PNG→WebP
3. 修改 `public/data/regions.json` 添加新区块
4. 修改 `loader.js` 中的 `CHAPTER_KEYS` 和 `CHAPTER_NAMES`
5. 重新构建部署

### 重新部署流程
```powershell
# 1. 确保在 master 分支
git checkout master

# 2. 修改代码后构建
npm run build

# 3. 切换到 gh-pages（需先删除根目录 TileMap 避免冲突）
Remove-Item TileMap -Recurse -Force
git checkout gh-pages --force

# 4. 更新构建产物
Copy-Item dist\assets\* -Destination assets\ -Force
Copy-Item dist\index.html -Destination index.html -Force

# 5. 提交推送
git add assets/ index.html
git commit -m "fix: xxx"
git push origin gh-pages
```

### 恢复瓦片（从 gh-pages 拉取）
```powershell
git checkout gh-pages -- TileMap/
Move-Item TileMap public\TileMap -Force
```

## 数据源

原始数据来自 `G:\BG3_map` 项目的 MySQL 数据库：
- 数据库：`bg3_map`，连接：`root:root@localhost:3306`
- 导出脚本：`export_db.py`（已被 .gitignore 排除）
- 当前标记数：27 个（已审核）
