import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const docs = resolve(root, 'docs')

let errors = 0
function fail(msg) { console.error(`  FAIL  ${msg}`); errors++ }
function pass(msg) { console.log(`  OK    ${msg}`) }

console.log('\n=== 部署审查: docs/ 目录完整性检查 ===\n')

// 1. 核心文件
console.log('[1/5] 核心文件')
for (const file of ['index.html']) {
  if (existsSync(resolve(docs, file))) pass(file)
  else fail(`${file} 缺失`)
}
if (!existsSync(resolve(docs, 'assets'))) fail('assets/ 目录缺失')
else pass('assets/')

// 2. 数据文件
console.log('\n[2/5] 数据文件')
for (const file of ['regions.json', 'categories.json', 'markers.json', 'maps_index.json']) {
  const p = resolve(docs, 'data', file)
  if (!existsSync(p)) { fail(`data/${file} 缺失`); continue }
  try { JSON.parse(readFileSync(p, 'utf-8')); pass(`data/${file}`) }
  catch { fail(`data/${file} JSON 解析失败`) }
}

// 3. TileMap 目录
console.log('\n[3/5] TileMap 瓦片目录')
const tileDest = resolve(docs, 'TileMap')
if (!existsSync(tileDest)) {
  fail('docs/TileMap/ 目录不存在！运行 npm run build 或 node scripts/copy-tiles.js')
} else {
  pass('docs/TileMap/ 存在')
}

// 4. 瓦片完整性（对比 maps_index.json）
console.log('\n[4/5] 瓦片完整性')
if (existsSync(tileDest)) {
  const mapsIndex = JSON.parse(readFileSync(resolve(docs, 'data', 'maps_index.json'), 'utf-8'))
  let tileOk = 0
  let tileMissing = 0

  for (const [chapterKey, chapter] of Object.entries(mapsIndex)) {
    for (const map of chapter.maps || []) {
      const match = map.tile_url.match(/^\/TileMap\/([^/]+)\/([^/]+)\//)
      if (!match) continue
      const mapDir = resolve(tileDest, match[1], match[2])
      if (!existsSync(mapDir)) {
        fail(`${chapterKey}/${map.name} — 目录缺失`)
        tileMissing++
        continue
      }
      const zoomDirs = readdirSync(mapDir).filter(d => /^\d+$/.test(d))
      if (zoomDirs.length === 0) {
        fail(`${chapterKey}/${map.name} — 无缩放层级`)
        tileMissing++
        continue
      }
      tileOk++
    }
  }
  console.log(`  OK    ${tileOk} 张地图瓦片完整`)
  if (tileMissing > 0) fail(`${tileMissing} 张地图瓦片缺失`)
}

// 5. 图标和截图
console.log('\n[5/5] 静态资源')
if (existsSync(resolve(docs, 'icons'))) pass('icons/')
else fail('icons/ 目录缺失')
if (existsSync(resolve(docs, 'screenshots'))) pass('screenshots/')
else fail('screenshots/ 目录缺失')

// 总结
console.log('\n========================================')
if (errors === 0) {
  console.log('  审查通过 — 可以安全推送')
  console.log('========================================\n')
  process.exit(0)
} else {
  console.log(`  发现 ${errors} 个问题 — 推送前请修复！`)
  console.log('========================================\n')
  process.exit(1)
}
