# ADR-0002 — Clean Architecture layering in the API

- **Status:** Accepted
- **Date:** 2026-09-11
- **Deciders:** Victor Neves

## Context

`apps/api` implements a todo list: create, list, toggle, delete. Four operations, one entity,
storage in an array.

An honest description of the minimum viable implementation is *one Express file, about 80
lines*. Any structure beyond that is, on pure engineering grounds for this problem,
over-engineering — and [YAGNI](../sdlc/08-coding-standards.md#yagni--you-arent-gonna-need-it)
says so plainly.

But this repository's purpose is to practise the shape of professional software, and the
Dependency Inversion Principle is difficult to understand from prose and easy to understand
from a working example you can modify. The question is whether the teaching value justifies
the cost, and whether we are willing to say so out loud rather than pretending the pattern is
free.

## Options considered

### Option A — Single-file Express app

Routes with inline logic and a module-level array.

**Pros:** ~80 lines. Zero indirection. A new reader understands it in two minutes. Genuinely
the right answer for this problem.

**Cons:** Business rules are entangled with HTTP. Testing a rule requires spinning up a server
or mocking `req`/`res`. Demonstrates nothing about architecture.

### Option B — Layered (controller / service / repository)

The conventional three-tier split.

**Pros:** Familiar to nearly everyone. Modest file count. Testable services.

**Cons:** The dependency direction is usually left implicit, so the repository *interface*
typically ends up owned by the infrastructure layer. That inverts nothing, and it is exactly
the subtlety that makes Dependency Inversion worth teaching.

### Option C — Clean Architecture (domain / application / infrastructure / interface)

Four layers, dependencies pointing inward, repository interface owned by the domain.

**Pros:** The domain is pure and tests in microseconds with no I/O. The dependency rule is
explicit and **machine-enforceable**. Demonstrates DIP correctly, including the part people
get wrong. Swapping storage is provably a one-file change.

**Cons:** ~12 files for four operations. A new reader must learn the layering before they can
find anything. Real risk of teaching people to apply this everywhere, including where it is
unwarranted.

## Decision

**We choose Option C**, with the cost stated explicitly in the
[Architecture Guide](../sdlc/09-architecture.md#why-it-is-worth-the-ceremony-on-a-todo-app)
rather than buried.

The deciding reason: **the dependency rule can be enforced by a linter, and an enforced
architecture is the only kind that survives.** ESLint `no-restricted-imports` rules fail CI
when `domain/` imports from `infrastructure/`. That turns an architectural principle from a
convention people forget under deadline pressure into a gate they cannot pass. Options A and B
have nothing to enforce.

We are explicit that this is a **teaching choice, not an engineering one for this problem size**.
Writing it down is the point: an ADR that says "we over-engineered this on purpose, here is
why" is more honest and more useful than one that retroactively invents a scalability
requirement.

## Consequences

### What this makes easier

- Domain rules test with no server, no HTTP, no mocks — `Todo.create('')` in a sub-millisecond test.
- The in-memory store is provably swappable: one file plus one line in the composition root.
- The layering is enforced by CI, not by discipline, so it will not decay silently.
- `application/` reads as a complete inventory of what the system can do.

### What this makes harder

- Following a single request means opening four files. For four operations, this is a real
  and non-trivial cost to a newcomer.
- It models a pattern that is **wrong for most small projects**. Anyone copying this structure
  into a genuine weekend project is making a mistake, and this ADR is the warning label.
- More surface area to keep consistent as the app grows.

### What we will need to revisit

- If the app stays at this size indefinitely and the layering is only ever ceremony, consider
  collapsing `application/` into `interface/` and keeping only the domain boundary — most of
  the benefit, half the files.
- If a second delivery mechanism (CLI, GraphQL) is added, this decision pays for itself and
  should be reaffirmed rather than revisited.
