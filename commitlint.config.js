/**
 * Conventional Commits, narrowed to this repository's vocabulary.
 * See docs/sdlc/02-commit-convention.md for the reasoning behind each rule.
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // a new user-visible capability            → MINOR
        'fix', // a defect repair                          → PATCH
        'perf', // a performance improvement                → PATCH
        'refactor', // restructuring with NO behaviour change
        'docs', // documentation only
        'test', // tests only
        'build', // build system, bundler, dependencies
        'ci', // pipeline configuration
        'style', // formatting only — no meaning changes
        'chore', // maintenance that fits nothing above
        'revert', // reverts a previous commit
      ],
    ],
    // A wrong scope is worse than no scope, because tooling trusts it.
    'scope-enum': [
      2,
      'always',
      ['api', 'web', 'domain', 'deps', 'deps-dev', 'ci', 'docs', 'repo', 'release'],
    ],
    'scope-case': [2, 'always', 'kebab-case'],
    // Forbids a subject that *starts* uppercase, while still allowing proper nouns
    // mid-subject ("add TypeScript base config"). The stricter 'lower-case' rule
    // would reject TypeScript, ESLint and Prettier by name, which is not the
    // intent -- see docs/sdlc/02-commit-convention.md.
    'subject-case': [2, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 72],
    'body-leading-blank': [2, 'always'],
    'body-max-line-length': [2, 'always', 100],
    'footer-leading-blank': [2, 'always'],
  },
}
