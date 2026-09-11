# Architecture Decision Records

An ADR captures **one significant decision**: the context that forced it, the options, the
choice, and the consequences we accepted.

The reason to write them is narrow and specific. Code tells you *what* the system does. Tests
tell you what it is *supposed* to do. Neither tells you **what we considered and rejected, and
why** — and that is precisely the information a future maintainer needs before changing
something. Without it, every past decision looks either arbitrary or sacred, and both readings
lead to bad changes.

## When to write one

- A decision that is **expensive to reverse** (data model, framework, API contract)
- A decision where a reasonable engineer would ask *"why on earth did they do it that way?"*
- A decision the team argued about — **especially** if you lost the argument, because the
  losing case is the part that never otherwise gets recorded
- A decision to deliberately **not** do something conventional

Do **not** write one for a choice that is obvious, easily reversed, or already implied by an
existing ADR. An ADR nobody needed is noise that makes the ones that matter harder to find.

## Status lifecycle

```
Proposed ──→ Accepted ──→ Deprecated
                 │
                 └──────→ Superseded by ADR-NNNN
```

**ADRs are immutable once accepted.** You do not edit a decision to reflect a change of mind —
you write a new ADR that supersedes it, and link both ways. The record of having changed your
mind is itself valuable information.

## Format

Copy [`0000-template.md`](0000-template.md). Number sequentially. Filename:
`NNNN-short-kebab-case-title.md`.

## Index

| # | Title | Status |
| --- | --- | --- |
| [0001](0001-trunk-based-development-with-a-release-branch.md) | Trunk-based development with a release branch | Accepted |
| [0002](0002-clean-architecture-in-the-api.md) | Clean Architecture layering in the API | Accepted |
| [0003](0003-in-memory-session-storage.md) | In-memory session storage instead of a database | Accepted |
| [0004](0004-npm-workspaces-monorepo.md) | npm workspaces monorepo over separate repositories | Accepted |
| [0005](0005-squash-merge-and-conventional-commits.md) | Squash merges with Conventional Commit PR titles | Accepted |
