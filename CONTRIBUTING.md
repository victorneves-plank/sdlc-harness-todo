# Contributing

Short, and binding. The long form lives in [`docs/`](docs/).

## Setup

```bash
git clone https://github.com/victorneves-plank/sdlc-harness-todo.git
cd sdlc-harness-todo
npm install          # also installs the Husky git hooks
npm run verify       # confirm a clean baseline
```

Node.js >= 20 (see `.nvmrc`).

## The loop

```bash
git checkout develop && git pull
git checkout -b feat/<short-kebab-description>
# work, committing often
npm run verify
git push -u origin feat/<short-kebab-description>
gh pr create --base develop --title "feat(scope): imperative description"
```

Full detail: [Workflow Walkthrough](docs/sdlc/10-workflow-walkthrough.md).

## The rules that are actually enforced

| Rule | Enforced by |
| --- | --- |
| Branch from `develop`, never `main` | Branch protection |
| Commit messages follow [Conventional Commits](docs/sdlc/02-commit-convention.md) | Husky `commit-msg` hook |
| PR titles follow Conventional Commits | CI (`pr-title.yml`) |
| Lint, types, tests and build all pass | CI (`ci.yml`) |
| The domain layer imports nothing from infrastructure | ESLint `no-restricted-imports` |
| No direct pushes to `main` or `develop` | Branch protection |
| Conversations resolved before merge | Branch protection |

## The rules enforced by you

| Rule | Why |
| --- | --- |
| Branches live **under two days** | [The single most important rule here](docs/sdlc/01-branching-strategy.md#1-branch-lifetime-is-capped-at-two-days) |
| PRs stay **under 400 lines** | [Review effectiveness collapses above it](docs/sdlc/03-pull-request-guide.md#size-the-rule-everybody-breaks) |
| Every fix ships with a **regression test** | [Otherwise the bug is scheduled to return](docs/sdlc/05-definition-of-done.md) |
| You **read your own diff** before requesting review | Cheapest quality gate that exists |
| The [Definition of Done](docs/sdlc/05-definition-of-done.md) is honoured | The mainline is only releasable if every change was complete |

## Commit format

```
<type>(<scope>): <imperative, lowercase, no full stop, ≤72 chars>
```

Types: `feat` `fix` `perf` `refactor` `docs` `test` `build` `ci` `style` `chore` `revert`
Scopes: `api` `web` `domain` `deps` `ci` `docs` `repo`

```
feat(web): filter todos by completion status
fix(api): return 404 instead of 500 for an unknown todo id
refactor(domain): extract title validation into a value object
```

## Branch names

`<type>/<short-kebab-description>` — e.g. `feat/todo-completion-toggle`, `fix/empty-title-accepted`.
No issue numbers; the PR links the issue.

## Before you open a PR

```bash
npm run verify
```

Then read your own diff in the GitHub UI. Then fill in the template honestly — especially the
**Risk** section.

## Questions

Open a [discussion or issue](https://github.com/victorneves-plank/sdlc-harness-todo/issues).
If a rule here seems wrong, say so — the rules are the product, and an argument about them is
on topic. Significant changes to the process get an [ADR](docs/adr/).
