# ADR-0004 — npm workspaces monorepo over separate repositories

- **Status:** Accepted
- **Date:** 2026-09-11
- **Deciders:** Victor Neves

## Context

The project has two deployable units — a React frontend and a Node API — that change together
and share an API contract. We also need one CI pipeline, one set of governance documents, one
commit convention and one release stream, because the *process* is the subject of this
repository and a process split across two repos is two processes.

## Options considered

### Option A — Two repositories

**Pros:** Independent deploy cadence. Smaller checkouts. Clear ownership boundaries at scale.

**Cons:** The governance documents must be duplicated or a third repo invented for them. A
change spanning both apps needs two PRs with no atomic relationship — and "which merged first?"
becomes a real question. Two CI configurations to keep in step. For a harness, it doubles the
ceremony and halves the clarity.

### Option B — npm workspaces monorepo

`apps/web` and `apps/api` under one root `package.json`.

**Pros:** One `npm install`. One CI pipeline. Cross-cutting changes are one atomic, reviewable
PR. Governance lives in exactly one place. npm workspaces ship with npm — no extra tool.

**Cons:** CI runs everything on every change unless you add path filters. Shared root
dependencies can drift toward implicit coupling. Less realistic for large organisations with
independent teams.

### Option C — Monorepo with Nx or Turborepo

**Pros:** Task caching, affected-project detection, dependency graph visualisation.

**Cons:** A substantial tool to learn and configure, for two packages. Its main benefits
(caching, affected-only builds) matter at a scale this project will never reach.

## Decision

**We choose Option B — npm workspaces.**

The deciding reason: **the governance documents must have one home.** This repository's product
is its process. A process described in two places is a process that will diverge, and the first
time `apps/web`'s CONTRIBUTING says something different from `apps/api`'s, the harness has
failed at its only job.

Option C is rejected on [YAGNI](../sdlc/08-coding-standards.md#yagni--you-arent-gonna-need-it)
grounds: a build-caching tool for a project whose full build takes under thirty seconds solves
a problem we do not have, and adds one more thing a reader must learn before they can run
anything.

## Consequences

### What this makes easier

- `npm install` at the root sets up everything.
- A change to the API contract and its frontend consumer is **one PR, one review, one commit**.
- Shared tooling (ESLint, Prettier, TypeScript base config, Husky, commitlint) is configured once.
- One CHANGELOG, one version stream, one release ritual to practise.

### What this makes harder

- CI runs the full matrix on every change, including doc-only ones. Acceptable at this size;
  the fix, if it ever matters, is `paths-ignore` filters rather than splitting the repo.
- Versioning is lockstep: both apps share the root version even when only one changed. This is
  a real simplification and would be wrong for independently-consumed packages.
- It is not representative of how large organisations with independent teams actually work —
  worth knowing if you carry this structure elsewhere.

### What we will need to revisit

- If a third app or a genuinely shared library appears, add `packages/` and revisit whether a
  build orchestrator earns its keep.
- If the two apps ever need independent versioning or release cadence, this decision is wrong
  and should be replaced rather than patched.
