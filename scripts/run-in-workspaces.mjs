#!/usr/bin/env node
/**
 * Run an npm script in every workspace that defines it.
 *
 * `npm run <script> --workspaces --if-present` would do this, except that it exits
 * non-zero with "No workspaces found!" when the `apps/*` glob matches nothing —
 * which is the state of this repository between the toolchain landing and the first
 * app landing.
 *
 * The obvious workaround is `|| true`, which would also swallow genuine failures.
 * A gate that cannot distinguish "nothing to do" from "it broke" is not a gate, so
 * this script makes the distinction explicit instead.
 */
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const script = process.argv[2]
if (!script) {
  console.error('usage: run-in-workspaces.mjs <npm-script>')
  process.exit(2)
}

const appsDir = 'apps'
const workspaces = existsSync(appsDir)
  ? readdirSync(appsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => join(appsDir, entry.name))
      .filter((dir) => existsSync(join(dir, 'package.json')))
  : []

const targets = workspaces.filter((dir) => {
  const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
  return Boolean(manifest.scripts?.[script])
})

if (targets.length === 0) {
  console.log(`No workspace defines "${script}" yet — nothing to run.`)
  process.exit(0)
}

for (const target of targets) {
  console.log(`\n> ${target}: npm run ${script}`)
  execFileSync('npm', ['run', script, '--workspace', target], { stdio: 'inherit' })
}
