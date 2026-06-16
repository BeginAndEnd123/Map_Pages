# 数据文件字段说明

项目使用 4 个静态 JSON 文件提供地图数据，均位于 `public/data/` 目录。

---

## regions.json — 游戏章节/区域

```json
[
  {
    "id": 1,                    // 唯一标识（整数，自增）
    "name": "序章",             // 区域显示名称（侧边栏下拉选项）
    "description": "鹦鹉螺式魔法船",  // 区域描述（可选）
    "sort_order": 0,            // 排序序号（0=序章, 1=第1章...）
    "created_at": "2026-06-02T15:34:38"  // 创建时间（ISO 8601）
  }
]
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | int | 是 | 唯一标识，不可重复 |
| `name` | string | 是 | 章节显示名称，如"第1章" |
| `description` | string | 否 | 简短的区域描述 |
| `sort_order` | int | 否 | 排序号。0→chapter0, 1→chapter1，与 TileMap 章节目录对应 |
| `created_at` | string | 否 | 创建时间，ISO 8601 格式 |

---

## categories.json — 标记分类

```json
[
  {
    "id": 1,                    // 唯一标识
    "name": "传送点",            // 分类名称（侧边栏筛选、标记弹窗显示）
    "icon": "/icons/waypoint.svg",  // 分类图标路径（SVG 或 PNG）
    "sort_order": 0             // 排序序号
  }
]
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | int | 是 | 唯一标识 |
| `name` | string | 是 | 分类名称，如"传送点""怪物""道具""商人" |
| `icon` | string | 是 | 图标文件路径，相对于 `public/` 目录，如 `/icons/waypoint.svg` |
| `sort_order` | int | 否 | 显示顺序，越小越靠前 |

---

## markers.json — 地图标记点

```json
[
  {
    "id": 13,                   // 唯一标识
    "region_id": 5,             // 所属区域 ID（关联 regions.id）
    "category_id": 2,           // 分类 ID（关联 categories.id）
    "name": "蜘蛛洞",            // 标记名称（地图 Tooltip + 弹窗标题）
    "description": "",          // 标记描述（弹窗正文，支持纯文本）
    "x_coord": -69.87,          // 地图 X 坐标（Leaflet CRS.Simple 像素坐标）
    "y_coord": 182.31,          // 地图 Y 坐标
    "screenshot": "[]",         // 截图列表（JSON 字符串数组，存 URL 或空数组"[]"）
    "map_name": "幽影诅咒之地",  // 所属子地图名称（与 TileMap 子目录名一致）
    "target_region_id": null,   // 传送目标区域 ID（仅传送点标记需要）
    "target_map_name": "",      // 传送目标子地图名称
    "target_x": null,           // 传送目标 X 坐标
    "target_y": null,           // 传送目标 Y 坐标
    "status": "approved",       // 状态（"approved"=已审核）
    "submitted_by": null,       // 提交者 ID（管理员直接添加为 null）
    "created_at": "2026-06-03T10:19:57"  // 创建时间
  }
]
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | int | 是 | 唯一标识，不可重复 |
| `region_id` | int | 是 | 所属区域，关联 `regions.id` |
| `category_id` | int | 是 | 标记分类，关联 `categories.id` |
| `name` | string | 是 | 标记名称 |
| `description` | string | 否 | 详细描述 |
| `x_coord` | float | 是 | X 坐标（Leaflet CRS.Simple 坐标系，像素值） |
| `y_coord` | float | 是 | Y 坐标 |
| `screenshot` | string | 否 | JSON 字符串格式的截图 URL 数组，如 `["/screenshots/xxx.png"]` 或 `"[]"` |
| `map_name` | string | 否 | 子地图名称，必须与 TileMap 目录中子地图目录名一致 |
| `target_region_id` | int | 否 | 传送目标区域 ID（仅"传送点"分类标记需要） |
| `target_map_name` | string | 否 | 传送目标子地图名 |
| `target_x` | float | 否 | 传送目标 X 坐标 |
| `target_y` | float | 否 | 传送目标 Y 坐标 |
| `status` | string | 否 | 固定为 `"approved"`（静态站点只显示已审核标记） |
| `submitted_by` | int | 否 | 原始提交者用户 ID（静态站点已废弃，可忽略） |
| `created_at` | string | 否 | 创建时间 |

> **坐标说明**：坐标使用 Leaflet `CRS.Simple` 像素坐标系。
> X 轴向右为正，Y 轴向下为正。原点 (0,0) 在瓦片 0/0/0.webp 的左上角。
> 每个 zoom 级别坐标范围翻倍。

---

## maps_index.json — 地图瓦片索引

```json
{
  "chapter0": {                       // 章节目录名（与 TileMap/chapter0/ 对应）
    "chapter_name": "序章",            // 章节中文名
    "maps": [
      {
        "name": "鹦鹉螺式魔法船（第一层）",  // 子地图名称
        "tile_url": "/TileMap/chapter0/鹦鹉螺式魔法船（第一层）/{z}/{y}/{x}.webp",  // 瓦片 URL 模板
        "max_zoom": 5                 // 该子地图最大缩放级别
      }
    ]
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `<chapter_key>` | object | 顶层键，对应章节目录名（chapter0～chapter4） |
| `chapter_name` | string | 该章节的中文显示名 |
| `maps` | array | 该章节下的子地图列表 |
| `maps[].name` | string | 子地图名称（下拉列表显示名，同时用作 TileMap 中的子目录名） |
| `maps[].tile_url` | string | Leaflet 瓦片 URL 模板。`{z}`/`{y}`/`{x}` 会被 Leaflet 替换为实际值 |
| `maps[].max_zoom` | int | 该子地图的最大 zoom 级别（由 TileMap 目录中实际存在的最高 zoom 目录自动检测） |

---

## 本地导出标记 JSON

管理员通过页面"导出本地标记"按钮下载的 JSON 文件格式与 `markers.json` 一致，
可直接将内容合并到 `markers.json` 数组中。

其中 `screenshot` 字段可能包含 base64 格式的图片数据（data:image/...），
如需减小文件体积可手动转换为独立图片文件后改为 URL 引用。
