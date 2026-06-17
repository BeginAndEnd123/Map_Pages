import { rmSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const docs = resolve(__dirname, '..', 'docs')

if (!existsSync(docs)) process.exit(0)

// Only remove assets/ — old hashed JS/CSS would accumulate otherwise.
// Everything else (data/ icons/ screenshots/ TileMap/ etc.) stays.
const assetsDir = resolve(docs, 'assets')
if (existsSync(assetsDir)) {
  console.log('[clean-docs] remove assets/')
  rmSync(assetsDir, { recursive: true, force: true })
} else {
  console.log('[clean-docs] nothing to clean')
}
