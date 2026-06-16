import { cpSync, existsSync, statSync, writeFileSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const src = resolve(root, 'TileMap')
const dest = resolve(root, 'docs', 'TileMap')
const stampFile = resolve(root, 'docs', '.tilemap-stamp')

if (!existsSync(src)) {
  console.warn('[copy-tiles] TileMap/ not found, skipping')
  process.exit(0)
}

try {
  const srcMtime = statSync(src).mtimeMs
  if (existsSync(stampFile)) {
    const lastMtime = Number(readFileSync(stampFile, 'utf-8'))
    if (lastMtime >= srcMtime) {
      console.log('[copy-tiles] TileMap up to date, skipping')
      process.exit(0)
    }
  }
} catch { /* proceed with copy */ }

console.log('[copy-tiles] Copying TileMap to docs/TileMap ...')
cpSync(src, dest, { recursive: true })
writeFileSync(stampFile, String(Date.now()))
console.log('[copy-tiles] Done')
