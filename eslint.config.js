import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'

/**
 * The layer boundaries from docs/sdlc/09-architecture.md, expressed as lint rules.
 *
 * ADR-0002 chose Clean Architecture over a simpler layering specifically because the
 * dependency rule is machine-enforceable. This block is that claim being kept: an
 * architecture that is only documented is an architecture that decays, because nothing
 * fails when someone ignores it under deadline pressure.
 */
const forbid = (message, patterns) => ({
  'no-restricted-imports': ['error', { patterns: patterns.map((group) => ({ group, message })) }],
})

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/coverage/**', '**/node_modules/**', '**/*.config.js'],
  },

  js.configs.recommended,

  // Repository tooling that runs under Node directly, outside any workspace.
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: { globals: globals.node },
  },

  {
    files: ['**/*.{ts,tsx}'],
    extends: [...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        // Root-level config files (vitest.config.ts) belong to no app tsconfig.
        // allowDefaultProject lets them be linted without inventing a project for them.
        projectService: { allowDefaultProject: ['*.config.ts'] },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // An `any` disables the compiler exactly where you most needed it.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // A non-null assertion is a claim the compiler cannot check. Make it deliberate.
      '@typescript-eslint/no-non-null-assertion': 'warn',
      // An unawaited promise is a silent failure. This rule catches more real bugs
      // than every style rule in this file combined.
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },

  // ── The dependency rule ────────────────────────────────────────────────────
  // Dependencies point inward only. Each layer below lists what it may NOT reach.

  {
    files: ['apps/api/src/domain/**/*.ts'],
    rules: forbid(
      'The domain layer must not depend on anything outside itself. It holds the rules; ' +
        'storage, HTTP and frameworks are details. See docs/sdlc/09-architecture.md.',
      [
        ['**/application/**', '**/infrastructure/**', '**/interface/**'],
        ['express', 'express/*', 'cors', 'zod'],
      ],
    ),
  },

  {
    files: ['apps/api/src/application/**/*.ts'],
    rules: forbid(
      'Use cases orchestrate the domain. They must not know how data is stored or how ' +
        'requests arrive — depend on the repository interface the domain owns.',
      [
        ['**/infrastructure/**', '**/interface/**'],
        ['express', 'express/*', 'cors'],
      ],
    ),
  },

  {
    files: ['apps/api/src/infrastructure/**/*.ts'],
    rules: forbid(
      'Infrastructure implements interfaces the domain declares. It must not reach ' +
        'outward into the delivery mechanism.',
      [['**/interface/**'], ['express', 'express/*']],
    ),
  },

  // Features must not import from other features: that is how a frontend becomes a
  // graph. Anything two features need belongs in shared/.
  {
    files: ['apps/web/src/shared/**/*.{ts,tsx}'],
    rules: forbid('shared/ must not depend on any feature. The dependency points the other way.', [
      ['**/features/**'],
    ]),
  },

  // Tests may reach anywhere — they are allowed to know about wiring, and forcing
  // them to be architecturally pure makes them worse at their job.
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/test/**'],
    rules: {
      'no-restricted-imports': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
    },
  },

  // Must come last: turns off every rule that conflicts with Prettier, so formatting
  // is never argued about in review.
  prettier,
)
