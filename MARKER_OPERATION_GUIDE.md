# 标记操作 & 部署指南

本文档说明如何在本地代码文件中 **添加、修改、删除** 标记，然后推送到 GitHub 并更新线上静态网页。

---

## 一、标记数据文件

所有标记存储在 `public/data/markers.json`（一个 JSON 数组）。

构建后会自动复制到 `docs/data/markers.json`，GitHub Pages 从 `docs/` 目录提供服务。

> 你只需修改 `public/data/markers.json`，构建时会自动同步到 `docs/`。

### 标记对象结构

```json
{
  "id": 20,
  "region_id": 2,
  "category_id": 1,
  "name": "蜘蛛洞",
  "description": "挑战等级：8\n掉落：巨阙",
  "x_coord": -132.48,
  "y_coord": 112.16,
  "screenshot": [],
  "created_at": "2026-06-03T14:52:10",
  "map_name": "鹦鹉螺坠毁区域",
  "target_region_id": 2,
  "target_map_name": "低语深地",
  "target_x": -140.25,
  "target_y": 62.8,
  "status": "approved",
  "submitted_by": null
}
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | 数字 | 是 | 唯一标识，建议取当前最大id + 1 |
| `region_id` | 数字 | 是 | 章节区域：0=序章, 1=第1章, 2=第1.5章, 3=第2章, 4=第3章 |
| `category_id` | 数字 | 是 | 分类：1=传送点, 2=怪物, 3=道具, 4=商人 |
| `name` | 字符串 | 是 | 标记名称 |
| `description` | 字符串 | 否 | 描述文本（可用 `\n` 换行） |
| `x_coord` | 浮点数 | 是 | X坐标（游戏坐标系） |
| `y_coord` | 浮点数 | 是 | Y坐标（游戏坐标系） |
| `screenshot` | 数组 | 否 | 截图路径列表，如 `["screenshots/xxx.webp"]` |
| `created_at` | 字符串 | 否 | ISO 时间戳 |
| `map_name` | 字符串 | 是 | 所属地图名称 |
| `target_region_id` | 数字/null | 否 | 传送目标区域ID（仅传送点需要） |
| `target_map_name` | 字符串 | 否 | 传送目标地图名（仅传送点需要） |
| `target_x` | 浮点数/null | 否 | 传送目标X坐标（仅传送点需要） |
| `target_y` | 浮点数/null | 否 | 传送目标Y坐标（仅传送点需要） |
| `status` | 字符串 | 是 | 固定 `"approved"` |
| `submitted_by` | 字符串/null | 否 | 提交者，通常为 `null` |

---

## 二、操作步骤

### 添加一个标记

1. 用编辑器打开 `public/data/markers.json`
2. 在数组末尾（`]` 之前）新增一个标记对象
3. 确保 `id` 不重复，字段填写完整
4. 保存文件

示例：

```json
{
  "id": 231,
  "region_id": 1,
  "category_id": 3,
  "name": "新道具名称",
  "description": "这里写描述",
  "x_coord": 100.5,
  "y_coord": -50.3,
  "screenshot": [],
  "created_at": "2026-06-17T10:00:00",
  "map_name": "鹦鹉螺坠毁区域",
  "target_region_id": null,
  "target_map_name": "",
  "target_x": null,
  "target_y": null,
  "status": "approved",
  "submitted_by": null
}
```

### 修改一个标记

1. 打开 `public/data/markers.json`
2. 找到对应 `id` 的标记对象
3. 修改需要更改的字段值
4. 保存文件

### 删除一个标记

1. 打开 `public/data/markers.json`
2. 找到对应 `id` 的标记对象
3. 删除该对象及其前面的逗号（保持 JSON 格式合法）
4. 保存文件

---

## 三、构建 & 部署

### 3.1 构建

```bash
npm run build
```

这行命令做了两件事：
- `vite build` — 编译 Vue 源码 + 将 `public/` 复制到 `docs/`
- `node scripts/copy-tiles.js` — 将地图瓦片复制到 `docs/TileMap/`

### 3.2 提交 & 推送

```bash
git add -A
git commit -m "feat: 更新标记数据 — 添加/修改/删除标记 XXX"
git push
```

提交后 GitHub Pages 会在 **1~3 分钟** 内自动部署到：
`https://beginandend123.github.io/Map_Pages/`

### 3.3 验证

推送后等待 1~3 分钟，打开线上地址确认标记已更新。

---

## 四、快速参考

```bash
# 1. 修改 public/data/markers.json（添加/修改/删除标记）

# 2. 构建
npm run build

# 3. 提交并推送
git add -A
git commit -m "feat: 更新标记数据"
git push

# 4. 等待1~3分钟后访问 https://beginandend123.github.io/Map_Pages/ 验证
```
