import { readFileSync, writeFileSync } from 'node:fs'

for (const file of ['public/data/markers.json', 'docs/data/markers.json']) {
  const markers = JSON.parse(readFileSync(file, 'utf-8'))
  const oldIds = markers.map(m => m.id)
  markers.forEach((m, i) => { m.id = i })
  writeFileSync(file, JSON.stringify(markers, null, 2) + '\n', 'utf-8')
  console.log(`${file}: ${markers.length} markers renumbered (${oldIds[0]}..${oldIds.at(-1)} → 0..${markers.length - 1})`)
}
