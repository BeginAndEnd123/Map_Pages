# 项目运作原理

## 一句话总结

一个运行在浏览器里的单页应用：用 Leaflet 渲染游戏地图瓦片，在上面叠加交互式标记点，管理员登录后可以增删改标记，所有修改保存在浏览器 localStorage 中。

---

## 1. 整体架构图

```
浏览器
├── index.html
├── assets/index-xxx.js  (Vue SPA 打包产物)
└── assets/index-xxx.css
        │
        ▼
┌──────────────────────────────────────────────────────────┐
│  App.vue                                                 │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  NavBar.vue  (顶部导航栏)                            │ │
│  │  ├── 移动端菜单按钮 → toggleSidebar()                │ │
│  │  └── 管理员登录/登出 (SHA-256 密码验证)               │ │
│  └─────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  HomeView.vue  (主页)                                │ │
│  │                                                       │ │
│  │  ┌────────────┐  ┌──────────────────────────────┐   │ │
│  │  │ SidePanel  │  │  MapContainer  (Leaflet 地图) │   │ │
│  │  │ ┌────────┐ │  │  ├── 瓦片图层 (tileLayer)    │   │ │
│  │  │ │Map-    │ │  │  ├── 标记图层 (markerLayer)   │   │ │
│  │  │ │Sidebar │ │  │  ├── 高亮图层 (highlightLayer)│   │ │
│  │  │ │        │ │  │  └── 拾取图层 (pickLayer)     │   │ │
│  │  │ │·章节   │ │  │                               │   │ │
│  │  │ │ 切换   │ │  │  MarkerPopup (标记悬浮卡)      │   │ │
│  │  │ │·地图   │ │  │  MarkerForm  (添加/编辑表单)    │   │ │
│  │  │ │ 切换   │ │  │  CategoryManager (分类管理)     │   │ │
│  │  │ │·分类   │ │  │  RegionManager  (区域管理)      │   │ │
│  │  │ │ 筛选   │ │  │                               │   │ │
│  │  │ │·搜索   │ │  └──────────────────────────────┘   │ │
│  │  │ │·最新   │ │                                      │ │
│  │  │ │ 标记   │ │                                      │ │
│  │  │ └────────┘ │                                      │ │
│  │  └────────────┘                                      │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

## 2. 数据流

项目最核心的概念是 **JSON 基准数据 + localStorage 增量修改 = 最终数据**。

### 2.1 数据存储位置

| 位置 | 内容 | 说明 |
|------|------|------|
| `public/data/regions.json` | 5 个章节区域 | 构建时复制到 `docs/data/` |
| `public/data/categories.json` | 4 种标记分类 | 传送点/怪物/BOSS/商人 |
| `public/data/markers.json` | 已审核的标记 | 27 个标记的坐标/描述/截图 |
| `public/data/maps_index.json` | 各章节地图列表 | 每张地图的 tile_url + max_zoom |
| `localStorage.bg3_mod_markers` | 本地标记修改 | `{ additions:[], edits:{}, deletions:[] }` |
| `localStorage.bg3_mod_categories` | 本地分类修改 | 同上结构 |
| `localStorage.bg3_mod_regions` | 本地区域修改 | 同上结构 |
| `localStorage.bg3_admin_auth` | 登录标志 | `"true"` 或 `null` |
| `localStorage.bg3_admin_user` | 管理员用户对象 | `{ username:"admin", is_admin:true }` |

### 2.2 数据加载与合并流程

以加载标记为例，发生在 `HomeView.vue` 挂载时：

```
1. sources.js:  fetch('/Map_Pages/data/markers.json')  → jsonArr (27个标记)
2. storage.js:  localStorage.getItem('bg3_mod_markers') → modifications
3. merge.js:    mergeData(jsonArr, modifications)       → 最终数据

mergeData 的合并逻辑：
  a. 遍历 jsonArr，每个 item 用 edits 中同名 id 的字段覆盖
  b. 追加 additions 中的所有项
  c. 排除 deletions 中所有 id 的项
```

**关键点**：`mergeData` 对原始 JSON 数组做了**浅拷贝**（`return [..._cache]`），所以所有修改发生在内存和 localStorage，原始 JSON 文件不变。

### 2.3 数据缓存策略

`sources.js` 中的 `loadRegions/loadCategories/loadMarkers/loadMapsIndex` 都有内存缓存：
- 首次调用 → fetch JSON → 存缓存 → 返回拷贝
- 后续调用 → 直接返回缓存的拷贝
- `clearCaches()` 可强制刷新

---

## 3. 组件协作关系

### 3.1 核心数据流

```
Pinia Stores                    Composables                 Components
─────────────                   ────────────                ──────────
useMapStore (map.js)            useMapNavigation            HomeView (编排者)
  · regions                      · currentRegionId           MapSidebar
  · categories                   · selectedMapName           MapContainer
  · markers                      · loading                   MarkerPopup
  · maps                                                      MarkerForm
  · currentRegion                                            CategoryManager
  · currentMap                                               RegionManager
                     
useAuthStore (auth.js)          useSidebar                  NavBar
  · user                          · sidebarOpen              SidePanel
  · token                         · toggle/close/open
```

### 3.2 组件通信方式

HomeView 是唯一的 **编排者组件**，所有 composable 实例在此创建，所有子组件通过 props/emits 与它通信：

```
HomeView.vue
├── 创建所有 composable 实例:
│   nav = useMapNavigation()
│   search = useMarkerSearch()
│   recent = useRecentMarkers(5)
│   pick = usePickMode()
│   form = useMarkerForm()
│
├── 读取 mapStore/authStore (Pinia reactive)
│
├── 通过 props 向下传递数据
│   MapSidebar  ← :regions :categories :search-keyword ...
│   MapContainer ← :tile-url :markers :categories :pick-mode ...
│
└── 通过 emits 接收子组件事件
    MapSidebar  → @region-change @map-change @search-input ...
    MapContainer → @marker-click @marker-teleport @map-pick ...
```

**没有全局事件总线，没有 provide/inject**，全部通过 props/emits 显式传递。

### 3.3 关键交互流程

#### 用户搜索标记 → 地图定位

```
1. MapSidebar: v-model → search.keyword
2. search.onSearchInput() → 300ms 防抖 → 全局搜索merge后的所有标记
3. searchResults 更新 → MapSidebar 显示下拉结果
4. 用户点击结果 → search.onSearchSelect(marker, nav.switchToRegion)
5. nav.switchToRegion() → 切换章节+地图 → 加载对应标记 → flyTo坐标
```

#### 管理员添加标记

```
1. MapSidebar: 点击"添加标记" → @start-add
2. HomeView.onStartAdd() → pick.onStartAdd() → pickMode=true
3. MapContainer 点击地图 → @map-pick → pick.onMapPick(coords)
4. 用户拖拽微调位置，点击"确认位置"
5. pick.onConfirmPosition() → form.showAddForm=true
6. MarkerForm 显示表单，用户填写名称/分类/截图等
7. form.onFormSubmit(data, mapName) → mapStore.addMarker()
8. addMarker → crud.js: addItem('markers', data)
9. crud.js: 写入 localStorage.bg3_mod_markers.additions
```

#### 管理员删除标记

```
1. MapSidebar: 标记列表中点击删除
2. HomeView 或其他处理 → mapStore.removeMarker(id)
3. removeMarker → crud.js: deleteItem('markers', id)
4. crud.js: localStorage.bg3_mod_markers.deletions 追加 id
5. mapStore.markers 从数组中移除该项
```

---

## 4. 纯函数数据层 (`src/data/`)

### 4.1 模块职责

| 文件 | 类型 | 作用 |
|------|------|------|
| `sources.js` | 异步数据源 | fetch JSON + 内存缓存 + URL 拼接 |
| `storage.js` | 同步读写 | localStorage 封装，键名统一管理 |
| `merge.js` | 纯函数 | JSON 基准 + localStorage 修改 → 合并 |
| `auth.js` | 异步 + 同步 | SHA-256 密码校验，登录/登出/状态查询 |
| `crud.js` | 同步 | 标记/分类/区域的本地增删改 |
| `index.js` | Barrel | 统一导出，对外 API |

### 4.2 设计原则

- **数据层不依赖 Vue**：全部是纯 JS 函数，不 import Vue/Pinia
- **通过 index.js 统一对外**：store 和 composable 只 import from `'../data/index'`
- **storage 是同步的**（localStorage 本身同步），crud 利用这一点做即时写入
- **sources 是异步的**（fetch），但有内存缓存避免重复请求

---

## 5. 地图引擎 (Leaflet + CRS.Simple)

### 5.1 为什么用 CRS.Simple

游戏地图是**平面图片**而非地球球面，所以不能用标准的 EPSG:3857 坐标系。

Leaflet 的 `CRS.Simple` 将整个地图视为一个 1×1 的平面，所有坐标是像素级：
- 瓦片 URL 模板：`TileMap/{chapter}/{map}/tiles/{z}/{x}/{y}.webp`
- 标记坐标 `(x_coord, y_coord)` 直接对应平面像素坐标
- 不需要经纬度转换，不需要投影算法

### 5.2 瓦片渲染流程

```
1. 用户选择章节+地图 → tileUrl 更新
   tileUrl = BASE + 'TileMap/chapter1/xxx/{z}/{x}/{y}.webp'
2. MapContainer watch(tileUrl) → updateTileLayer(url)
3. Leaflet 根据当前视野自动计算需要的瓦片 (z, x, y)
4. 对每块瓦片发 GET 请求 → 渲染 <img> 到 canvas
```

瓦片文件的 z/x/y 遵循 TMS 规范（左上角原点），与 Leaflet 默认一致。

### 5.3 MapContainer 暴露的方法

```js
defineExpose({ flyTo, highlightMarker, clearHighlight, resetView })
```

父组件通过 `ref="mapRef"` 获取，调用 `mapRef.value.flyTo(x, y)` 来平滑导航到指定坐标。

---

## 6. 路由

Vue Router Hash 模式（`createWebHashHistory`）：

| 路由 | 组件 | 说明 |
|------|------|------|
| `#/` | HomeView | 地图主页 |
| `#/*` | NotFoundView | 404 页面 |

Hash 模式兼容 GitHub Pages，因为服务端无法为 SPA 做 fallback。

---

## 7. 构建与部署

### 7.1 构建流程

```
npm run build
  ├── vite build
  │   ├── 读取 vite.config.js: base='/Map_Pages/', outDir='docs'
  │   ├── 编译 src/ → docs/assets/index-xxx.js + index-xxx.css
  │   ├── 处理 index.html → docs/index.html (自动注入 script/css)
  │   └── 复制 public/ 内容 → docs/ (data/ icons/ favicon.svg)
  │
  └── node scripts/copy-tiles.js
      └── 复制 TileMap/ → docs/TileMap/
```

### 7.2 GitHub Pages 配置

```
Settings → Pages → Source: Deploy from a branch
  Branch: master
  Folder: /docs
```

线上地址：`https://beginandend123.github.io/Map_Pages/`

### 7.3 BASE 路径的重要性

`vite.config.js` 中 `base: '/Map_Pages/'` 决定了：
- 构建产物中所有资源路径前缀为 `/Map_Pages/`
- `import.meta.env.BASE_URL` = `/Map_Pages/`
- `sources.js` 中所有 fetch 路径：`BASE + 'data/markers.json'` = `/Map_Pages/data/markers.json`

如果仓库改名，必须同步修改 `base`。

---

## 8. 管理员认证

```
login(password)
  → crypto.subtle.digest('SHA-256', password)
  → 对比 '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'
  → 匹配则写入 localStorage.bg3_admin_auth = 'true'
```

- 密码明文在 nav 输入框输入，浏览器内 SHA-256 后与硬编码 hash 比对
- 无网络请求，无服务端
- 登出只清除 localStorage 两个键
- 页面刷新后 `App.vue` 的 `onMounted` 调用 `authStore.fetchUser()` 恢复登录态

---

## 9. 响应式设计

| 断点 | 行为 |
|------|------|
| >768px | SidePanel 固定在左侧 280px，NavBar 显示品牌名 |
| ≤768px | SidePanel 变成遮罩式抽屉（`position: fixed`），NavBar 显示汉堡菜单，用户名隐藏，缩小间距 |

`SidePanel.vue` 在 `onMounted` 时检测窗口宽度，通过 `resize` 事件动态切换 `isMobile` class。
`useSidebar.js` 初始值也根据 `window.innerWidth > 768` 决定：桌面端默认展开，移动端默认收起。

---

## 10. 文件组织总结

```
src/
├── main.js              # Vue 入口: createApp → Pinia → Router → mount
├── App.vue              # 根: NavBar + router-view + 全局错误捕获
├── style.css            # CSS 变量 + 全局样式 (暗色金边主题)
│
├── data/                # ★ 纯函数数据层 (不依赖 Vue)
│   ├── index.js         # 统一导出
│   ├── sources.js       # fetch JSON + 缓存
│   ├── storage.js       # localStorage 读写
│   ├── merge.js         # JSON+localStorage 合并
│   ├── auth.js          # SHA-256 登录
│   └── crud.js          # 本地 CRUD
│
├── stores/              # Pinia 响应式状态
│   ├── auth.js          # 用户认证状态
│   └── map.js           # 地图数据状态
│
├── composables/         # 组合式函数 (业务逻辑)
│   ├── useMapNavigation.js   # 章节/地图切换
│   ├── useMarkerSearch.js    # 全局搜索
│   ├── useRecentMarkers.js   # 最新标记分页
│   ├── useMarkerForm.js      # 标记表单提交
│   ├── usePickMode.js        # 坐标拾取
│   └── useSidebar.js          # 侧边栏开关
│
├── components/          # 视图组件
│   ├── NavBar.vue            # 顶部导航
│   ├── SidePanel.vue         # 侧边栏容器 (响应式)
│   ├── MapSidebar.vue        # 侧边栏内容 (章节/搜索/标记列表)
│   ├── MapContainer.vue      # Leaflet 地图
│   ├── MarkerPopup.vue       # 标记详情悬浮卡
│   ├── MarkerForm.vue        # 添加/编辑标记表单
│   ├── CategoryManager.vue   # 分类管理
│   └── RegionManager.vue     # 区域管理
│
├── views/               # 路由页面
│   ├── HomeView.vue          # 主页 (编排者)
│   └── NotFoundView.vue      # 404

public/data/             # 静态 JSON (构建时→docs/data/)
  ├── regions.json       # 章节区域
  ├── categories.json    # 标记分类
  ├── markers.json       # 标记数据
  └── maps_index.json    # 地图索引

TileMap/                 # WebP 瓦片 (~171MB)
scripts/
  ├── copy-tiles.js      # 构建后复制瓦片
  └── check-tiles.js     # 瓦片完整性检查
```
