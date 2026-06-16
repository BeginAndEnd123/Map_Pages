import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const mapsIndex = JSON.parse(readFileSync(resolve('public/data/maps_index.json'), 'utf-8'))
const tileRoot = resolve('TileMap')

const issues = []
let ok = 0

for (const [chapterKey, chapter] of Object.entries(mapsIndex)) {
  for (const map of chapter.maps || []) {
    // Example tile_url: /TileMap/chapter1/低语深地/{z}/{y}/{x}.webp
    const match = map.tile_url.match(/^\/TileMap\/([^/]+)\/([^/]+)\//)
    if (!match) {
      issues.push(`[PARSE_ERR] ${chapterKey}: ${map.name} — bad URL: ${map.tile_url}`)
      continue
    }
    const expectedDir = resolve(tileRoot, match[1], match[2])
    if (!existsSync(expectedDir)) {
      issues.push(`[MISSING] ${chapterKey}: ${map.name} — expected dir: ${expectedDir}`)
      continue
    }
    // Check at least one zoom level exists
    const zoomDirs = readdirSync(expectedDir).filter(d => /^\d+$/.test(d))
    if (zoomDirs.length === 0) {
      issues.push(`[EMPTY] ${chapterKey}: ${map.name} — dir exists but has no zoom levels`)
      continue
    }
    ok++
  }
}

console.log(`OK: ${ok}`)
if (issues.length > 0) {
  console.log(`\nIssues (${issues.length}):`)
  issues.forEach(i => console.log(' ', i))
} else {
  console.log('\nAll maps have tile directories.')
}
