# 标记操作 & 部署指南

本文档说明如何 **添加、修改、删除** 标记，然后推送到 GitHub 并更新线上静态网页。

**改标记不需要 `npm run build`。** 标记是纯 JSON 文件，浏览器直接 fetch，直接改 `docs/` 下的即可。

---

## 一、数据文件位置

| 文件 | 作用 |
|---|---|
| `docs/data/markers.json` | **线上实际使用**，必须修改 |
| `public/data/markers.json` | 源文件，**保持同步** |

> 两个文件必须同步修改。`public/` 是备份源，`docs/` 是 GitHub Pages 真正读取的。

---

## 二、标记对象结构

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
  "target_region_id": null,
  "target_map_name": "",
  "target_x": null,
  "target_y": null,
  "status": "approved",
  "submitted_by": null
}
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | 数字 | 是 | 唯一标识 |
| `region_id` | 数字 | 是 | 章节：0=序章, 1=第1章, 2=第1.5章, 3=第2章, 4=第3章 |
| `category_id` | 数字 | 是 | 分类：1=传送点, 2=怪物, 3=道具, 4=商人 |
| `name` | 字符串 | 是 | 标记名称 |
| `description` | 字符串 | 否 | 描述 |
| `x_coord` | 浮点数 | 是 | X坐标 |
| `y_coord` | 浮点数 | 是 | Y坐标 |
| `screenshot` | 数组 | 否 | 截图路径 |
| `created_at` | 字符串 | 否 | ISO 时间戳 |
| `map_name` | 字符串 | 是 | 所属地图名称 |
| `target_region_id` | 数字/null | 否 | 传送目标区域（仅传送点） |
| `target_map_name` | 字符串 | 否 | 传送目标地图（仅传送点） |
| `target_x` | 浮点数/null | 否 | 传送目标X（仅传送点） |
| `target_y` | 浮点数/null | 否 | 传送目标Y（仅传送点） |
| `status` | 字符串 | 是 | 固定 `"approved"` |
| `submitted_by` | 字符串/null | 否 | 提交者 |

---

## 三、操作步骤

### 添加标记

1. 打开 `docs/data/markers.json`
2. 在数组末尾 `]` 之前新增一个标记对象
3. 确保 `id` 不重复（取当前最大 id + 1）
4. 同样修改 `public/data/markers.json`（保持同步）

### 修改标记

1. 打开 `docs/data/markers.json`
2. 找到对应 `id` 的标记对象，修改字段
3. 同样修改 `public/data/markers.json`

### 删除标记

1. 打开 `docs/data/markers.json`
2. 找到对应 `id` 的对象，删除它（注意删除前面的逗号）
3. 同样修改 `public/data/markers.json`

---

## 四、部署（无需构建）

```powershell
# 1. 确认两个文件都已修改
npm run verify

# 2. 提交并推送
git add docs/data/markers.json public/data/markers.json
git commit -m "deploy: 更新标记 — xxx"
git push
```

1~3 分钟后生效：`https://beginandend123.github.io/Map_Pages/`
