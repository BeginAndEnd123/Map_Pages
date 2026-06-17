import { execSync } from 'node:child_process'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))

function run(cmd) {
  console.log(`\n> ${cmd}`)
  execSync(cmd, { stdio: 'inherit', cwd: root })
}

run('node scripts/clean-docs.js')
run('npx vite build')
run('node scripts/copy-tiles.js')
console.log('\nBuild done.')
