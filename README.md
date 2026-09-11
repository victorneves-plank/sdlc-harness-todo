# SDLC Harness — Todo App

> A **practice harness for the Software Development Life Cycle**: a small, deliberately
> boring Todo application wrapped in a full, opinionated, industry-grade delivery process.
>
> The application is the *excuse*. The **process is the product**.

[![CI](https://github.com/victorneves-plank/sdlc-harness-todo/actions/workflows/ci.yml/badge.svg)](https://github.com/victorneves-plank/sdlc-harness-todo/actions/workflows/ci.yml)

---

## What this repository is

Most "best practices" repos show you a finished codebase. This one shows you the
**machinery around the codebase** — the branching model, the commit grammar, the PR
contract, the review standard, the Definition of Done, the CI gates, and the release
ritual — and then gives you a trivial app to exercise all of it on.

If you want to practise *shipping software properly*, you need something safe to ship.
That is what the Todo app is for.

## The application (the excuse)

| Part | Stack | Notes |
| --- | --- | --- |
| `apps/api` | Node.js + TypeScript + Express | **In-memory session storage.** Todos live in a plain array behind a repository interface. No database. |
| `apps/web` | React + TypeScript + Vite | Feature-sliced UI talking to the API over HTTP. |

State is intentionally ephemeral — restart the API and the todos are gone. That is a
*feature*: it keeps the domain small enough that the process stays in focus, and it
demonstrates the Dependency Inversion Principle (the in-memory store is an *adapter*,
swappable for Postgres without touching a single line of domain code).

## The harness (the product)

Everything that governs how change flows into this repository lives in [`docs/`](docs/).

| Document | What it settles |
| --- | --- |
| [Branching Strategy](docs/sdlc/01-branching-strategy.md) | `main` / `develop` / short-lived branches, and why this is still trunk-based |
| [Commit Convention](docs/sdlc/02-commit-convention.md) | Conventional Commits, enforced by commitlint |
| [Pull Request Guide](docs/sdlc/03-pull-request-guide.md) | PR size, title grammar, description contract |
| [Code Review Standard](docs/sdlc/04-code-review-standard.md) | What reviewers look for, review SLAs, comment taxonomy |
| [Definition of Done](docs/sdlc/05-definition-of-done.md) | The single checklist that decides "is it finished?" |
| [Testing Strategy](docs/sdlc/06-testing-strategy.md) | Test pyramid, what to test, what not to test |
| [Release & Versioning](docs/sdlc/07-release-and-versioning.md) | SemVer, release PRs, tagging, CHANGELOG |
| [Coding Standards](docs/sdlc/08-coding-standards.md) | Clean Code, SOLID, YAGNI, DRY, KISS — with teeth |
| [Architecture Guide](docs/sdlc/09-architecture.md) | Clean Architecture layering and the dependency rule |
| [Workflow Walkthrough](docs/sdlc/10-workflow-walkthrough.md) | The end-to-end runbook: idea → issue → branch → PR → release |
| [Delivery Metrics](docs/sdlc/11-metrics-and-dora.md) | The four DORA metrics and how to read them here |
| [Verifying the Harness](docs/sdlc/12-verifying-the-harness.md) | How to break each gate on purpose and confirm it still fires |
| [ADRs](docs/adr/) | Architecture Decision Records — *why* things are the way they are |

Start with the [Workflow Walkthrough](docs/sdlc/10-workflow-walkthrough.md) if you want
the practical loop, or [ADR-0001](docs/adr/0001-trunk-based-development-with-a-release-branch.md)
if you want the reasoning behind the branching model.

## Quick start

```bash
# Requires Node.js >= 20
npm install          # installs all workspaces
npm run dev          # runs API (:3000) and web (:5173) together
```

Other commands:

```bash
npm run lint         # ESLint across all workspaces
npm run typecheck    # tsc --noEmit across all workspaces
npm test             # Vitest across all workspaces
npm run build        # production build of every workspace
npm run verify       # lint + typecheck + test + build — the same gate CI runs
```

Run `npm run verify` before you open a pull request. If it passes locally, CI will pass.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md). It is short, and it is binding.

## Licence

[MIT](LICENSE)
