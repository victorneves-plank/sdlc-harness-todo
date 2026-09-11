# Documentation

The harness. Everything that governs how change flows into this repository.

## Read in this order

If you are new here, this sequence gets you productive fastest:

1. **[Workflow Walkthrough](sdlc/10-workflow-walkthrough.md)** — the whole loop with commands.
   Start here.
2. **[Branching Strategy](sdlc/01-branching-strategy.md)** — where branches come from and how
   long they may live.
3. **[Commit Convention](sdlc/02-commit-convention.md)** — the grammar your commits must follow.
4. **[Definition of Done](sdlc/05-definition-of-done.md)** — when work is allowed to be called
   finished.
5. Everything else, as you need it.

## Process

| Doc | Settles |
| --- | --- |
| [01 — Branching Strategy](sdlc/01-branching-strategy.md) | `main`, `develop`, short-lived branches, protection rules |
| [02 — Commit Convention](sdlc/02-commit-convention.md) | Conventional Commits, types, scopes, breaking changes |
| [03 — Pull Request Guide](sdlc/03-pull-request-guide.md) | Size limits, title grammar, description contract |
| [04 — Code Review Standard](sdlc/04-code-review-standard.md) | What reviewers look for, comment taxonomy, SLAs |
| [05 — Definition of Done](sdlc/05-definition-of-done.md) | The checklist |
| [06 — Testing Strategy](sdlc/06-testing-strategy.md) | The pyramid, what to test, what not to |
| [07 — Release & Versioning](sdlc/07-release-and-versioning.md) | SemVer, release PRs, tags, CHANGELOG |
| [10 — Workflow Walkthrough](sdlc/10-workflow-walkthrough.md) | The end-to-end runbook |
| [11 — Delivery Metrics](sdlc/11-metrics-and-dora.md) | DORA's four keys and how this process targets them |

## Engineering

| Doc | Settles |
| --- | --- |
| [08 — Coding Standards](sdlc/08-coding-standards.md) | Clean Code, SOLID, YAGNI, DRY, KISS — and when each does *not* apply |
| [09 — Architecture Guide](sdlc/09-architecture.md) | Clean Architecture layering, the dependency rule, the API contract |

## Decisions

| ADR | Decision |
| --- | --- |
| [0001](adr/0001-trunk-based-development-with-a-release-branch.md) | Trunk-based development with a release branch |
| [0002](adr/0002-clean-architecture-in-the-api.md) | Clean Architecture layering in the API |
| [0003](adr/0003-in-memory-session-storage.md) | In-memory session storage instead of a database |
| [0004](adr/0004-npm-workspaces-monorepo.md) | npm workspaces monorepo over separate repositories |
| [0005](adr/0005-squash-merge-and-conventional-commits.md) | Squash merges with Conventional Commit PR titles |

See [the ADR index](adr/) for when and how to write one.

## Sources

This harness is assembled from published industry practice, not invented. The primary sources:

- Martin Fowler — [Patterns for Managing Source Code Branches](https://martinfowler.com/articles/branching-patterns.html),
  [Continuous Integration](https://martinfowler.com/articles/continuousIntegration.html),
  [YAGNI](https://martinfowler.com/bliki/Yagni.html), *Refactoring*
- Robert C. Martin — *Clean Code*, *Clean Architecture*
- [Trunk Based Development](https://trunkbaseddevelopment.com/)
- [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)
- [Semantic Versioning 2.0.0](https://semver.org/) · [Keep a Changelog](https://keepachangelog.com/)
- [Google Engineering Practices — Code Review](https://google.github.io/eng-practices/review/)
- [DORA](https://dora.dev/) — *Accelerate*, Forsgren, Humble & Kim
- Hunt & Thomas — *The Pragmatic Programmer* (DRY)
- [Testing Library guiding principles](https://testing-library.com/docs/guiding-principles)

Where these sources disagree — and they do, notably on `develop` branches — the disagreement is
recorded in an ADR rather than resolved silently.
