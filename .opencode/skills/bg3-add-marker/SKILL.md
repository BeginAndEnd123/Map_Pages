---
name: bg3-add-marker
description: 为 BG3 交互式地图静态站点添加新标记点。自动更新 public/data/markers.json，按规范填入 region_id、category_id、map_name、坐标和截图，然后构建部署到 GitHub Pages。触发条件："添加标记"、"新增标记"、"add marker"、"bg3 标记"。
---

# BG3 地图 — 添加标记

## 前置信息

| 项目 | 值 |
|------|-----|
| 项目目录 | `G:\Map_Pages` |
| 数据文件 | `public/data/markers.json`（28 条，部署后自动复制到 `dist/data/`） |
| 在线地址 | `https://beginandend123.github.io/Map_Pages/` |
| 远程仓库 | `https://github.com/BeginAndEnd123/Map_Pages.git` |
| 部署分支 | `gh-pages`（`master` 为源码） |

> **重要**：此 skill 所在目录 `.opencode/` 已加入 `.gitignore`，不会被推送。

## markers.json 字段说明

```json
{
  "id": 230,                              // 唯一 ID（参照 README.md 获取当前最大 ID+1）
  "region_id": 1,                         // 所属区域。1=序章 2=第1章 3=第1.5章 4=第2章 5=第3章
  "category_id": 2,                       // 分类。1=传送点 2=怪物 3=道具 4=商人
  "name": "十代",                          // 标记名称
  "description": "掉落：xxx",              // 描述，可选
  "x_coord": -123.25,                     // X 坐标（Leaflet CRS.Simple 像素值）
  "y_coord": 84.5,                        // Y 坐标
  "screenshot": "[]",                     // 截图（JSON 字符串数组，如 "[]" 或 "[\"/screenshots/xxx.png\"]"）
  "map_name": "鹦鹉螺式魔法船（第一层）",   // 所属子地图，必须与 TileMap 子目录名和 maps_index.json 中一致
  "target_region_id": null,               // 传送目标区域 ID（仅传送点需要）
  "target_map_name": "",                  // 传送目标子地图名
  "target_x": null,                       // 传送目标 X
  "target_y": null,                       // 传送目标 Y
  "status": "approved",                   // 固定 "approved"
  "submitted_by": null,                   // 固定 null
  "created_at": "2026-06-16T12:49:49.578Z" // ISO 8601 时间戳
}
```

### 如何获取 `map_name`

`map_name` 必须与 `maps_index.json` 和 `TileMap/` 中的目录名严格一致。
运行以下命令查看所有可用的子地图：

```powershell
python -c "import json; d=json.load(open('public/data/maps_index.json',encoding='utf-8')); [print(f'{k}: {[m[\"name\"] for m in v[\"maps\"]]}') for k,v in d.items()]"
```

### 如何获取坐标

1. 在线页面以管理员身份登录（密码 `admin123`）
2. 点击"新增标记"
3. 在地图上点击目标位置 → 显示红色标记
4. 拖动微调位置后**不要点确认**，打开浏览器控制台（F12）
5. 运行 `JSON.parse(localStorage.getItem('bg3_local_markers'))` 查看 `x_coord` / `y_coord`

## 添加流程

### 1. 编辑 JSON

在 `public/data/markers.json` 的数组末尾添加新标记对象（注意 JSON 语法：逗号分隔、花括号闭合）。

### 2. 确认 JSON 有效

```powershell
python -c "import json; json.load(open('public/data/markers.json',encoding='utf-8')); print('OK')"
```

### 3. 本地验证（可选）

```powershell
# 临时改 base 为 / 后构建测试
(Get-Content vite.config.js) -replace "base: '/Map_Pages/'", "base: '/'" | Set-Content vite.config.js
npm run build
# 在 dist 目录启动服务器测试
python -m http.server 8080 --directory dist
# 浏览器打开 http://localhost:8080 查看新标记
# 测试完后恢复 base
(Get-Content vite.config.js) -replace "base: '/'", "base: '/Map_Pages/'" | Set-Content vite.config.js
```

### 4. 提交并推送

```powershell
git add public/data/markers.json
git commit -m "feat: 添加标记 [名称]"
git push origin master
```

### 5. 构建部署

```powershell
# 确保 TileMap 存在
if (-not (Test-Path public/TileMap)) {
    git checkout gh-pages -- TileMap/
    Move-Item TileMap public/TileMap -Force
}
# 构建
rm dist -Recurse -Force -ErrorAction SilentlyContinue
npm run build
# 部署
git checkout gh-pages --force
Copy-Item dist/data/markers.json -Destination data/markers.json -Force
git add data/markers.json
git commit -m "data: 更新标记数据"
git push origin gh-pages
git checkout master --force
```

## 常见问题

### ❌ 标记不显示
- 检查 `region_id` 是否匹配当前选中的章节
- 检查 `map_name` 是否与子地图名完全一致（含全角括号等）
- 确认 `status` 为 `"approved"`
- 确认 JSON 语法正确（最后一个标记后不能有逗号）

### ❌ 坐标偏移
- Leaflet CRS.Simple 原点在 `0/0/0.webp` 的左上角
- X 右为正，Y 下为正
- 每个 zoom 级别坐标范围翻倍

### ❌ 推送失败
- 网络不稳定时多试几次
- 也可通过 GitHub 网页端直接编辑 `data/markers.json` 提交
