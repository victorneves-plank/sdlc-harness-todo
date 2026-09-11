# 08 — Coding Standards

> **Status:** Binding, and the thing reviewers review against.
> **Sources:** Robert C. Martin, *Clean Code*; Martin Fowler, *Refactoring*; the
> [c2 wiki](https://wiki.c2.com/) tradition behind YAGNI, DRY and KISS.

Principles are not rules. Every one below can be wrong in a specific situation, and an
engineer who applies them mechanically does more damage than one who has never heard of them.
What each principle gives you is a **question worth asking**. This document states the
principle, then — more usefully — states **when it does not apply**.

---

## The four cross-cutting principles

### KISS — Keep It Simple

> The simplest thing that could possibly work, until it demonstrably cannot.

Simple is not the same as easy, and it is not the same as short. Simple means **few moving
parts and few interactions between them**. A clever one-liner with three nested ternaries is
short and complex. A ten-line `if`/`else` chain that reads top to bottom is long and simple.
Prefer the second.

The practical test: **can you hold the whole thing in your head at once?** If understanding a
function requires you to keep four other files open, it is not simple, no matter how elegant
the abstraction.

```ts
// ❌ clever
const active = todos.filter(t => !t.completed).reduce((a, t) => ({ ...a, [t.id]: t }), {})

// ✅ simple
const activeTodos = todos.filter(todo => !todo.completed)
const byId = new Map(activeTodos.map(todo => [todo.id, todo]))
```

**When it does not apply:** genuine complexity exists. Some problems are hard, and a simple
solution to a hard problem is usually a wrong solution. Do not flatten essential complexity —
isolate it, name it, test it heavily, and keep it away from the code around it.

### YAGNI — You Aren't Gonna Need It

> Do not build it until you actually need it.

The argument for building something now is always the same: *"we'll definitely need this
later, and it's cheaper to do it now."* [Fowler's analysis](https://martinfowler.com/bliki/Yagni.html)
shows why this reasoning usually loses money:

- **Cost of build** — you pay now for value that arrives later, or never.
- **Cost of delay** — the feature you actually needed shipped later because of it.
- **Cost of carry** — every line is read, maintained, refactored around and worked *through*
  for its entire life. Speculative code taxes every future change.
- **Cost of repair** — you guessed the requirement wrong, which is the common case. Now you
  must remove or rework an abstraction other code has already grown into.

```ts
// ❌ speculative: one storage backend exists, and none is planned
interface StorageAdapter<T, K extends keyof T, S extends SerializationStrategy> { … }

// ✅ what the problem needs
interface TodoRepository {
  findAll(): readonly Todo[]
  save(todo: Todo): void
}
```

**When it does not apply — and this distinction matters more than the principle:** YAGNI
applies to **presumptive features**, not to quality. It is never an argument against tests,
error handling, security, accessibility or clear naming. "YAGNI, skip the validation" is a
misuse of the term.

It also does not apply to decisions that are **expensive to reverse**. Fowler's own caveat:
YAGNI works because most software decisions are cheap to change later. Where that is false —
a data model in a database with real users, a public API contract, an authentication
scheme — think ahead. The cost of getting it wrong is not symmetrical.

### DRY — Don't Repeat Yourself

> Every piece of **knowledge** must have a single, unambiguous, authoritative representation
> within a system. — Hunt & Thomas, *The Pragmatic Programmer*

Read that definition again: it is about **knowledge**, not about characters. DRY is the most
misunderstood principle in this document, and the misunderstanding is expensive.

Two pieces of code that look identical but encode *different rules that happen to coincide
today* are not duplication. Merging them couples two things that will need to change
independently — and when they do, someone adds a boolean parameter, then another, and you
have a function with five flags that nobody dares touch.

```ts
// These look identical. They are NOT duplication.
const isValidTodoTitle = (s: string) => s.trim().length > 0 && s.length <= 200
const isValidUserBio   = (s: string) => s.trim().length > 0 && s.length <= 200
// The 200s are unrelated. When bios grow to 500, you want to change one of them.
```

```ts
// This IS duplication: the same rule, written twice.
if (todo.title.trim().length === 0) throw new Error('empty')   // in the route
if (title.trim().length === 0) throw new Error('empty')        // in the service
// One rule, one home: put it in the Todo entity.
```

> **Prefer duplication over the wrong abstraction.** — Sandi Metz

Duplication is cheap and visible; a wrong abstraction is expensive and invisible. The
professional move is to **wait for the third occurrence** before extracting. Two is a
coincidence; three is a pattern, and by the third you can actually see the shape of the
abstraction rather than guessing at it.

**When it does not apply:** tests. Test code tolerates — often benefits from — duplication,
because a test should be readable in isolation without jumping to a shared helper to find out
what it actually does. A DRY test suite is frequently an unreadable one.

### The Boy Scout Rule

> Always leave the code a little cleaner than you found it.

Not "stop and rewrite the module". Rename one bad variable. Delete one dead branch. Add the
comment that would have saved you ten minutes. Small, constant, opportunistic improvement is
the only thing that actually beats entropy, because the big cleanup project never gets
approved.

**The boundary:** cleanup goes in your PR only if it is *in the code you were already
touching*. Unrelated cleanup goes in its own PR — mixing it in makes your change
[unreviewable](03-pull-request-guide.md#size-the-rule-everybody-breaks).

---

## Clean Code

### Names

A name should tell you **what it is, why it exists, and how it is used**. If a name needs a
comment to explain it, the name has failed.

```ts
// ❌
const d = new Date()
const l = todos.filter(x => x.c)
function proc(data: any) {}

// ✅
const createdAt = new Date()
const completedTodos = todos.filter(todo => todo.completed)
function normaliseTodoTitle(rawTitle: string): string {}
```

Rules with teeth:

- **Pronounceable and searchable.** You cannot grep for `d`, and you cannot discuss it out loud.
- **No type encoding.** `todoList`, not `todoArray`. TypeScript knows the type.
- **Booleans read as predicates:** `isCompleted`, `hasTodos`, `canEdit`.
- **Functions are verbs; classes and types are nouns.**
- **Length scales with scope.** `i` inside a three-line loop is fine. A module-level `i` is not.
- **One word per concept.** Pick `fetch` or `get` or `retrieve` — then use it everywhere.
  Three synonyms for one idea force the reader to wonder whether the difference is meaningful.

### Functions

- **Small.** Uncle Bob says under 20 lines; treat that as a smell threshold, not a law.
- **Do one thing.** The test: can you extract a meaningfully-named function from inside it?
  If yes, it was doing more than one thing.
- **One level of abstraction per function.** Do not mix `calculateTotal()` with
  `buffer.push(byte)` in the same body — the reader has to change altitude mid-sentence.
- **Few arguments.** Zero to two is comfortable; three needs a reason; four wants an object.
- **No boolean parameters.** `render(true)` is unreadable at the call site. Two functions, or
  a named options object.
- **No side effects the name does not promise.** `validateTitle()` must not also save.
- **Command–query separation.** A function either *does* something or *answers* something.
  Not both.

```ts
// ❌ three jobs, a flag, and a lie in the name
function saveTodo(todo: Todo, validate: boolean, notify: boolean): boolean {}

// ✅
function assertValidTodo(todo: Todo): void {}
function saveTodo(todo: Todo): void {}
function notifyTodoSaved(todo: Todo): void {}
```

### Comments

> A comment is a failure to express yourself in code. — paraphrasing Uncle Bob

Not an absolute — some comments are essential — but the default should be to **improve the
code instead of explaining it**.

```ts
// ❌ restates the code; will drift out of date and then lie
// increment the counter by one
counter += 1

// ❌ a comment compensating for a bad name
// the list of todos that are not done
const l = …

// ✅ explains WHY — information the code genuinely cannot carry
// The spec allows duplicate titles, so we key on id rather than title even
// though title lookups would be more convenient for the UI. See ADR-0004.
const byId = new Map(todos.map(todo => [todo.id, todo]))

// ✅ warns about a non-obvious consequence
// Returns a frozen copy: callers previously mutated the internal array and
// corrupted the store. See #61.
```

Delete commented-out code. Git remembers it. Nobody will ever uncomment it, and everybody
will be slightly afraid to delete it.

### Error handling

- **Throw typed errors, never strings.** `InvalidTodoTitleError`, not `throw 'bad title'`.
- **Never swallow.** An empty `catch` is a bug someone will spend a day finding.
- **Fail fast.** Validate at the boundary, then trust your types inside.
- **Errors are part of your API.** Document what a function throws as carefully as what it
  returns.

### Formatting

Not your problem. Prettier decides, ESLint enforces, CI checks. **Never discuss formatting in
a code review** — if it is worth arguing about, encode it in the config; if it is not, let it go.

---

## SOLID

SOLID is most useful as a vocabulary for *diagnosing* code that has become hard to change.
The names matter less than the smells they point at.

### S — Single Responsibility

> A module should have one, and only one, reason to change.

The emphasis is on **reason to change**, i.e. one stakeholder, one axis of variation — not
"one function". A `TodoService` that validates, persists and formats HTTP responses has three
reasons to change, and all three will pull it in different directions.

```ts
// ❌
class TodoService {
  create(title: string) {
    if (!title.trim()) throw new Error('empty')          // domain rule
    this.todos.push({ id: randomUUID(), title })          // persistence
    return `<li>${title}</li>`                            // presentation
  }
}

// ✅ three reasons to change, three homes
Todo.create(title)                 // domain rule
todoRepository.save(todo)          // persistence
toTodoResponse(todo)               // presentation
```

**When it does not apply:** do not shatter a coherent 30-line class into six one-method
classes because each method "does something different". Over-application of SRP produces
codebases where you must open nine files to follow one operation — which is a complexity
problem, not a solution to one.

### O — Open/Closed

> Open for extension, closed for modification.

Adding a new behaviour should not require editing existing, tested code. In practice: program
against an interface, and add an implementation.

```ts
interface TodoRepository { findAll(): readonly Todo[]; save(todo: Todo): void }
class InMemoryTodoRepository implements TodoRepository {}
// A PostgresTodoRepository is added, not swapped in by editing the service.
```

**When it does not apply:** do not build extension points for extensions nobody has asked for.
That is YAGNI. This project has exactly one repository implementation — the interface earns
its place by enabling *tests* and by enforcing the dependency rule, not by an imagined Postgres
migration.

### L — Liskov Substitution

> Subtypes must be usable anywhere their base type is expected, without surprising the caller.

An implementation that throws `NotSupportedError` for half the interface has broken the
contract. The caller cannot use it as the interface promised, so the abstraction is a lie.

If an implementation cannot honour a method, **the interface is too big** — split it (see ISP).

### I — Interface Segregation

> No client should be forced to depend on methods it does not use.

```ts
// ❌ a read-only consumer now depends on save, remove and clear
interface TodoStore { findAll(); findById(id); save(t); remove(id); clear() }

// ✅
interface TodoReader { findAll(): readonly Todo[]; findById(id: TodoId): Todo | undefined }
interface TodoWriter { save(todo: Todo): void; remove(id: TodoId): void }
```

Narrow interfaces are also dramatically easier to fake in tests — which is usually where you
first feel the pain of a fat one.

### D — Dependency Inversion

> Depend on abstractions, not concretions. High-level policy must not depend on low-level detail.

This is the load-bearing principle of [Clean Architecture](09-architecture.md) and the one
this codebase is organised around. `ToggleTodoCompletion` depends on the `TodoRepository`
*interface*. The interface is defined in the **domain** layer, alongside the code that uses
it — not in the infrastructure layer that implements it.

That ownership detail is the whole trick, and it is what "inversion" refers to: the direction
of the source-code dependency is the opposite of the direction of control flow.

---

## TypeScript specifics

- **`strict: true`**, always. Non-negotiable.
- **No `any`.** Use `unknown` and narrow. An `any` disables the compiler exactly where you
  most needed it.
- **No non-null assertions (`!`) without a comment** explaining how you know.
- **Prefer `type` for unions and object shapes; `interface` for contracts you expect to implement.**
- **Make illegal states unrepresentable.** This is the highest-leverage thing TypeScript
  offers — a bug you cannot express is a bug you cannot ship:

```ts
// ❌ permits { status: 'loading', error: 'boom', data: [...] } — meaningless
type State = { status: string; data?: Todo[]; error?: string }

// ✅ the compiler rejects the meaningless combinations
type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; todos: readonly Todo[] }
  | { status: 'error'; message: string }
```

- **Use branded types for identifiers.** `type TodoId = string & { readonly __brand: 'TodoId' }`
  stops you passing a user id where a todo id belongs.
- **`readonly` by default** on arrays and properties you do not intend callers to mutate.

## Tooling

| Concern | Tool | Gate |
| --- | --- | --- |
| Formatting | Prettier | `npm run format:check` in CI |
| Lint | ESLint (typescript-eslint) | `npm run lint` in CI |
| Types | `tsc --noEmit`, strict | `npm run typecheck` in CI |
| Tests | Vitest | `npm test` in CI |
| Commit messages | commitlint + Husky | `commit-msg` hook, and CI on PR title |

**Anything a tool can check, a tool should check.** Reviewer attention is the scarcest resource
in the process — spend it on design and correctness, never on semicolons.

## See also

- [Architecture Guide](09-architecture.md) — where these principles land structurally
- [Code Review Standard](04-code-review-standard.md) — how these are enforced socially
