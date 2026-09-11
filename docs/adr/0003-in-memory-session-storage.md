# ADR-0003 — In-memory session storage instead of a database

- **Status:** Accepted
- **Date:** 2026-09-11
- **Deciders:** Victor Neves

## Context

The todo application needs somewhere to keep todos. The repository's purpose is to practise
**delivery process**, not persistence engineering.

Any real datastore brings a tail of incidental work: a connection string, a migration tool, a
schema, a docker-compose file, a CI service container, seed data, and a "why is the test suite
failing on a clean checkout" problem for every future reader. All of that is time spent not
practising the thing this repository exists to practise.

## Options considered

### Option A — In-memory array in the API process

A `Todo[]` inside `InMemoryTodoRepository`.

**Pros:** Zero setup; `npm install && npm run dev` works on a clean machine. Integration tests
use the *real* implementation, not a fake, so they are both fast and honest. Keeps the domain
tiny.

**Cons:** Data is lost on restart. Does not survive multiple server instances. Teaches nothing
about persistence.

### Option B — SQLite

**Pros:** Real persistence, real SQL, still file-based and no server.

**Cons:** Migrations, a schema, a query layer, and test isolation concerns (shared file state
between tests). Meaningful added surface for a repository about process.

### Option C — Postgres via docker-compose

**Pros:** Production-realistic. Exercises CI service containers.

**Cons:** Docker becomes a prerequisite to running the app at all. Slow tests. Substantial
setup burden on every reader, for a todo list.

## Decision

**We choose Option A.**

The deciding reason: **the harness must run on a clean machine with one command.** Anything
that can fail before the first test runs is friction between a learner and the process they
came to practise — and setup friction is the single most common reason a practice repository
gets abandoned.

The ephemerality is not merely tolerable, it is *useful*: it makes the storage boundary
tangible. You can restart the server, watch your data vanish, and see concretely that the
repository is a detail the domain does not depend on.

## Consequences

### What this makes easier

- One-command startup. No Docker, no migrations, no connection strings.
- Integration tests use the production implementation — no mock/reality drift, and they run
  in milliseconds.
- The storage boundary is visible and testable rather than theoretical.

### What this makes harder

- **All data is lost on restart.** This is documented prominently in the README so nobody is
  surprised.
- The API is single-instance by construction; horizontal scaling would break it immediately.
- Nothing is learned here about transactions, concurrency, or query performance — genuinely
  important topics this repository simply does not cover.
- **Tests must reset the store in `beforeEach`.** Module-level mutable state leaks between
  tests, and the resulting failures appear in innocent code. This is a real footgun and is
  called out in the [testing strategy](../sdlc/06-testing-strategy.md#test-independence).

### What we will need to revisit

- If this app is ever deployed anywhere real, in-memory storage becomes wrong immediately, not
  gradually.
- If the harness grows a lesson about migrations or transactions, revisit — but prefer a
  *separate* repository over complicating this one.

Because of [ADR-0002](0002-clean-architecture-in-the-api.md), reversing this decision is a
single-file change plus one line in the composition root. That is the specific, concrete payoff
of the layering.
