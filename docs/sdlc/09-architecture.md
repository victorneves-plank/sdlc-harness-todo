# 09 — Architecture Guide

> **Status:** Binding.
> **Source:** Robert C. Martin, *Clean Architecture*; Alistair Cockburn, *Hexagonal Architecture*.
> **Decision record:** [ADR-0002](../adr/0002-clean-architecture-in-the-api.md)

## The one rule

```
        ┌─────────────────────────────────────────────┐
        │  interface/   HTTP routes, controllers,     │  ← frameworks live here
        │               React components              │
        │    ┌───────────────────────────────────┐    │
        │    │  application/  use cases           │    │  ← orchestration
        │    │    ┌─────────────────────────┐     │    │
        │    │    │  domain/                │     │    │  ← rules. knows nothing.
        │    │    │  entities, value        │     │    │
        │    │    │  objects, repository    │     │    │
        │    │    │  INTERFACES, errors     │     │    │
        │    │    └─────────────────────────┘     │    │
        │    └───────────────────────────────────┘    │
        │  infrastructure/  repository IMPLEMENTATIONS │  ← details
        └─────────────────────────────────────────────┘

                  dependencies point INWARD, only
```

### The dependency rule

> **Source code dependencies must point only inward, toward higher-level policy.**

Concretely, in `apps/api`:

| Layer | May import from | May **never** import from |
| --- | --- | --- |
| `domain/` | nothing but itself | application, infrastructure, interface, Express, any library with I/O |
| `application/` | `domain/` | infrastructure, interface, Express |
| `infrastructure/` | `domain/` | interface |
| `interface/` | `application/`, `domain/` | — |

This is enforced mechanically by an ESLint `no-restricted-imports` rule, not by discipline.
A violation fails CI. Architecture that is only documented is architecture that decays.

### Why it is worth the ceremony on a todo app

It obviously is not *necessary* here — that is the honest starting point, and ignoring it
would make this document dishonest. A todo list can be one 80-line Express file, and for a
weekend project it should be.

The layering is here because this repository is a **harness**: you are practising the shape
you will need when the app is not a todo list. Two things it buys even at this size, both
real:

1. **The domain is testable with no I/O at all.** `Todo.create('')` throws in a test that
   starts in under a millisecond, with no server, no database, no HTTP.
2. **The in-memory store is provably swappable.** Not as a hypothetical — the `TodoRepository`
   interface means you could write `PostgresTodoRepository` and change exactly one line in
   the composition root. The domain would not know.

**The honest cost:** more files, more indirection, and a new reader must learn the layering
before they can find anything. On a real project of this size, that cost probably exceeds the
benefit. See [ADR-0002](../adr/0002-clean-architecture-in-the-api.md), which states the
trade-off plainly rather than pretending the pattern is free.

---

## Backend layers (`apps/api`)

### `domain/` — the rules

Pure TypeScript. No Express, no HTTP, no `process.env`, no clock you did not inject, no
imports from any outer layer. **Everything true about a todo independent of how it is stored
or delivered lives here.**

```
domain/
  todo/
    todo.ts                 # the Todo entity + its invariants
    todo-id.ts              # branded identifier type
    todo.repository.ts      # INTERFACE — owned by the domain
    todo.errors.ts          # InvalidTodoTitleError, TodoNotFoundError
```

The repository **interface** living in `domain/` is the essential detail of Dependency
Inversion, and the part most often got wrong. The domain declares *what it needs*;
infrastructure supplies it. The arrow of source-code dependency points from infrastructure
inward, which is the opposite of the direction data flows at runtime.

### `application/` — the use cases

One class or function per use case, named as a **user intention**: `CreateTodo`,
`ToggleTodoCompletion`, `RemoveTodo`, `ListTodos`. Each orchestrates domain objects and
repositories. No business rules of its own — if you find an `if` encoding a *rule* here, it
belongs in the entity.

```ts
export class ToggleTodoCompletion {
  constructor(private readonly todos: TodoRepository) {}

  execute(id: TodoId): Todo {
    const todo = this.todos.findById(id)
    if (!todo) throw new TodoNotFoundError(id)
    const toggled = todo.toggleCompletion()   // the RULE lives in the entity
    this.todos.save(toggled)
    return toggled
  }
}
```

Reading the `application/` directory should tell you **everything the system can do**. That is
the test of whether the naming is right.

### `infrastructure/` — the details

Implementations of the interfaces the domain declared. Here, one:

```ts
export class InMemoryTodoRepository implements TodoRepository {
  private readonly todos: Todo[] = []          // the session memory
  findAll(): readonly Todo[] { return [...this.todos] }   // a COPY — see below
  …
}
```

Note `[...this.todos]`. Returning the internal array directly would let any caller mutate the
store from outside, which destroys every invariant the domain enforces. **Encapsulation is not
optional just because the storage is simple.**

### `interface/` — the delivery mechanism

Express routes, request validation (zod), error-to-HTTP-status mapping, response DTOs. This
layer's whole job is **translation**: HTTP in, use case called, result out.

Uncle Bob's framing is the useful one: *the web is a delivery mechanism, a detail.* You should
be able to put a CLI in front of the same use cases without touching anything inward of this
directory.

### Composition root

Exactly one place wires concrete implementations to interfaces — `src/main.ts`. It is the
only file that knows both that `InMemoryTodoRepository` exists and that `ToggleTodoCompletion`
needs a repository. Everything else receives its dependencies.

```ts
const todoRepository = new InMemoryTodoRepository()
const app = createApp({
  listTodos: new ListTodos(todoRepository),
  createTodo: new CreateTodo(todoRepository),
  toggleTodoCompletion: new ToggleTodoCompletion(todoRepository),
  removeTodo: new RemoveTodo(todoRepository),
})
```

No DI container. For four use cases, a container would be pure ceremony — manual wiring is
explicit, greppable and type-checked. That is [KISS](08-coding-standards.md#kiss--keep-it-simple)
applied to architecture itself.

---

## Frontend structure (`apps/web`)

Clean Architecture's layer names do not transplant usefully into a React SPA, so the frontend
uses **feature-sliced** organisation with the same underlying principle: *dependencies point
toward the stable core.*

```
src/
  features/todo/
    api/            HTTP client — the ONLY place that knows about fetch and URLs
    components/     presentational + container components
    hooks/          useTodos — state and effects
    types.ts        the shapes the UI works with
  shared/
    components/     Button, Input — no feature knowledge
    lib/            generic helpers
  App.tsx
  main.tsx
```

Rules:

- **Features do not import from other features.** If two need the same thing, it belongs in
  `shared/`. This is the rule that stops a frontend turning into a graph.
- **`shared/` never imports from `features/`.** Same dependency rule, one layer up.
- **Network access is confined to `features/*/api/`.** A component that calls `fetch` directly
  is untestable without a network mock and un-reusable in any other context.
- **Components render; hooks decide.** Keep data-fetching, derivation and state transitions in
  hooks so the components stay dumb and trivially testable.

---

## The API contract

```
GET    /api/todos              → 200 { todos: TodoDto[] }
POST   /api/todos              → 201 { todo: TodoDto }     body { title: string }
PATCH  /api/todos/:id          → 200 { todo: TodoDto }     body { completed?: boolean, title?: string }
DELETE /api/todos/:id          → 204
GET    /api/health             → 200 { status: 'ok' }
```

Errors are uniform, which lets the frontend handle them in one place:

```json
{ "error": { "code": "INVALID_TITLE", "message": "Title must not be empty" } }
```

| Code | Status |
| --- | --- |
| `INVALID_TITLE` | 400 |
| `TODO_NOT_FOUND` | 404 |
| `INTERNAL_ERROR` | 500 |

## On session memory

Todos live in a plain array in the API process. **Restart the server and they are gone.** This
is deliberate — it keeps the domain small so the process stays the subject of this repository.

The architectural point is that this limitation is confined to exactly one file,
`infrastructure/in-memory-todo.repository.ts`. Nothing in `domain/` or `application/` knows or
cares. Replacing it with a real database is a single-file change plus one line in the
composition root — and the fact that we can state that with confidence, rather than hope, is
what the layering bought.

## See also

- [Coding Standards](08-coding-standards.md) — SOLID, which this structure is an application of
- [ADR-0002](../adr/0002-clean-architecture-in-the-api.md) — why, and at what cost
