import { rmSync, existsSync, readdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const docs = resolve(__dirname, '..', 'docs')

if (!existsSync(docs)) process.exit(0)

const keep = new Set(['TileMap', '.tilemap-stamp'])

for (const entry of readdirSync(docs)) {
  if (keep.has(entry)) {
    console.log(`[clean-docs] skip ${entry}/`)
    continue
  }
  console.log(`[clean-docs] remove ${entry}/`)
  rmSync(resolve(docs, entry), { recursive: true, force: true })
}
