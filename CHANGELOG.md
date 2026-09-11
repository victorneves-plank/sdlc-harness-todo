# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Entries are written **for humans**. A commit says `fix(api): return 404 for unknown todo id`;
the entry here says what that means to someone using the thing.

## [Unreleased]

<!-- Add entries here as they merge into develop. They move into a version section at release. -->

## [0.1.0] — 2026-09-11

The first release. A working todo application, and the delivery process that produced it.

### Added

#### The application

- **Todo API** (`apps/api`) — Node.js, TypeScript and Express, storing todos in a plain array
  in process memory. Create, list, update and delete, with titles trimmed and validated
  (non-empty, at most 200 characters), `404` for an unknown id, and a uniform error body.
  **All data is lost when the server restarts** — this is deliberate; see ADR-0003.
- **Todo web app** (`apps/web`) — React, TypeScript and Vite. Add, complete and delete todos,
  filter by all / active / completed with counts, and per-filter empty states. Completion and
  deletion apply optimistically and roll back if the request fails. A stopped API shows a
  readable message and a retry button rather than a blank screen.

#### The harness

- **Eleven process documents** covering branching, commits, pull requests, code review, the
  Definition of Done, testing, releases, coding standards, architecture, an end-to-end runbook
  and delivery metrics. Every principle states the conditions under which it does *not* apply.
- **Five Architecture Decision Records** for the branching model, the API layering, in-memory
  storage, the monorepo layout and the merge strategy — each naming its downsides and the
  trigger that should make us revisit it.
- **Enforcement**: Conventional Commits validated by a Husky `commit-msg` hook, a blocking PR
  title check, ESLint rules that fail the build when the Clean Architecture dependency rule is
  violated, strict TypeScript, and branch protection on `main` and `develop` that applies to
  administrators too.
- **GitHub templates** — a pull request template carrying the Definition of Done inline, three
  issue forms, CODEOWNERS and Dependabot.
- **55 tests** across both applications — 42 for the API, 13 for the web app.

### Known limitations

These are documented decisions rather than oversights — see `SECURITY.md`:

- No authentication or authorisation; every endpoint is open.
- No persistence: todos exist only in the running API process.
- The API is single-instance by construction and has no rate limiting.
- Permissive CORS.

**Do not deploy this anywhere public.**

[Unreleased]: https://github.com/victorneves-plank/sdlc-harness-todo/compare/v0.1.0...develop
[0.1.0]: https://github.com/victorneves-plank/sdlc-harness-todo/releases/tag/v0.1.0
