import { existsSync, readdirSync } from 'node:fs'
import { defineConfig } from 'vitest/config'

/**
 * Each workspace owns its own Vitest config, because they need different
 * environments — node for the API, jsdom for the web app. This root config only
 * discovers them.
 *
 * The glob is resolved eagerly rather than handed to Vitest as `projects: ['apps/*']`,
 * because Vitest treats a projects glob that matches nothing as a startup error. That
 * is the correct default for a real repository and the wrong one here, where the
 * toolchain deliberately lands before the apps do. Same reasoning as
 * scripts/run-in-workspaces.mjs.
 */
const workspaces = existsSync('apps')
  ? readdirSync('apps', { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => `apps/${entry.name}`)
  : []

export default defineConfig({
  test: {
    ...(workspaces.length > 0 ? { projects: workspaces } : {}),
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      // Coverage is reported, never gated. A threshold optimises for the metric, and
      // the cheapest way to satisfy one is assertion-free tests that execute lines
      // without checking anything. See docs/sdlc/06-testing-strategy.md.
      exclude: ['**/dist/**', '**/*.config.*', '**/main.tsx', '**/main.ts'],
    },
  },
})
