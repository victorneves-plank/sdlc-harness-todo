# 06 — Testing Strategy

> **Status:** Binding.
> **Runner:** [Vitest](https://vitest.dev/) across both workspaces.

## What tests are for

Tests are not for proving the code works. They are for making the code **safe to change**.

That reframing decides everything else in this document. A test suite that verifies
correctness but breaks on every refactor has failed at its actual job — it has made the code
*harder* to change, and it will be deleted or ignored within a year. A suite you trust is one
you can refactor behind.

Fowler's test for whether your suite is doing its job: *if you make a change that introduces
a bug, does a test go red?* And its neglected twin: *if you make a change that introduces
no bug, do the tests stay green?* Both must be yes.

## The shape of the suite

```
          ╱╲          End-to-end       few, slow, high confidence
         ╱  ╲                          (not in this repo — see below)
        ╱────╲
       ╱      ╲       Integration      some, medium
      ╱────────╲                       API route → service → repository
     ╱          ╲
    ╱────────────╲    Unit             many, fast, precise
   ╱──────────────╲                    domain rules, pure functions, hooks
```

The proportions matter more than the labels. **Push tests down.** A rule that can be tested
as a pure function should be — it will run in a millisecond, fail with a precise message, and
never be flaky.

### Unit tests — the base

For pure logic with no I/O: domain entities, validation rules, pure helpers, reducers.

```ts
// apps/api/src/domain/todo/todo.test.ts
it('rejects a title that is only whitespace', () => {
  expect(() => Todo.create({ title: '   ' })).toThrow(InvalidTodoTitleError)
})
```

Fast enough that you run them on every save. If a "unit" test needs a mock of a mock, it is
not a unit test — it is an integration test wearing a disguise, and the design underneath is
probably wrong.

### Integration tests — the middle

For the wiring: does the HTTP route reach the right use case, does the repository store what
the service handed it, does the error map to the right status code?

```ts
// apps/api/src/interface/http/todo.routes.test.ts
it('returns 400 when the title is empty', async () => {
  const res = await request(app).post('/api/todos').send({ title: '' })
  expect(res.status).toBe(400)
  expect(res.body.error.code).toBe('INVALID_TITLE')
})
```

These use the **real** in-memory repository, not a mock. The in-memory store *is* the
production store here, which makes integration tests unusually cheap in this project — a
genuine benefit of the architecture, not an accident.

### Component tests — the frontend's middle

React components are tested through the user's eyes with
[Testing Library](https://testing-library.com/), whose guiding principle is the one to
internalise:

> *The more your tests resemble the way your software is used, the more confidence they can
> give you.*

```tsx
it('adds a todo when the form is submitted', async () => {
  render(<TodoApp />)
  await userEvent.type(screen.getByLabelText(/what needs doing/i), 'Buy milk')
  await userEvent.click(screen.getByRole('button', { name: /add/i }))
  expect(await screen.findByText('Buy milk')).toBeInTheDocument()
})
```

Query by **role and accessible name**, not by test id or class name. This is not just a
testing preference: a component you cannot query by role is a component a screen reader
cannot navigate. The test discipline and the accessibility discipline are the same discipline.

### End-to-end — deliberately absent

There are none in this repository, and that is a decision rather than an omission. The app
is a todo list with two surfaces; the integration and component layers already cover the
paths a browser would exercise, and a Playwright setup here would cost real maintenance to
re-confirm what is already confirmed. That is [YAGNI](08-coding-standards.md#yagni--you-arent-gonna-need-it)
applied to tests, which are code and carry the same carrying cost as any other code.

**When to add them:** authentication, payment, or any flow where a failure is unrecoverable
and spans both apps. Until then, no.

## What not to test

Testing the wrong things is how suites become hated. Do not test:

- **Implementation details.** If renaming a private method breaks a test, the test was
  asserting on structure, not behaviour.
- **The framework.** React renders. Express routes. These are tested by their maintainers.
- **Types the compiler already proves.** A test asserting `typeof result === 'string'` on a
  function typed `(): string` verifies nothing TypeScript has not already guaranteed.
- **Trivial pass-throughs.** A getter that returns a field needs no test.
- **Mocks.** A test where every dependency is mocked verifies that your mocks agree with each
  other. It will pass forever, including while production is on fire.

## Naming

Describe the **behaviour and its condition**, never the method name:

| ❌ | ✅ |
| --- | --- |
| `it('tests create')` | `it('assigns a unique id to each created todo')` |
| `it('works')` | `it('returns an empty list before any todo is added')` |
| `it('TodoService.remove')` | `it('throws TodoNotFoundError when removing an unknown id')` |

A failing test's name should tell you what broke **without opening the file**. That is the
entire point of the name.

## Structure: Arrange–Act–Assert

```ts
it('marks a todo as completed', () => {
  // Arrange
  const repository = new InMemoryTodoRepository()
  const todo = repository.add(Todo.create({ title: 'Buy milk' }))

  // Act
  const updated = new ToggleTodoCompletion(repository).execute(todo.id)

  // Assert
  expect(updated.completed).toBe(true)
})
```

One logical assertion per test. Several `expect` calls checking facets of the *same* outcome
are fine; two unrelated behaviours in one test are not — when it fails you will not know which.

## Test independence

Every test creates its own state and cleans up after itself. **No shared mutable fixtures.**

This matters acutely in this project: the API's storage is a module-level array. A test that
leaks state into it makes the *next* test fail, and the failure will appear to be in innocent
code. Reset in `beforeEach`, always.

Tests must pass in any order and in parallel. If a test only passes when run alone, it is not
a test — it is a coin flip.

## Coverage

Coverage is reported, not gated. There is no minimum percentage, and that is intentional:
a coverage threshold optimises for the metric, and the cheapest way to satisfy it is to write
assertion-free tests that execute lines without checking anything. You end up with a green
badge and no safety net.

Use coverage **diagnostically**. A file at 20% is a question worth asking. A file at 100% is
not evidence of anything.

```bash
npm run test:coverage
```

## Test-driven development

Encouraged, not mandated. The loop:

1. **Red** — write a failing test that describes the behaviour you want.
2. **Green** — write the simplest code that passes. Simplest, not best.
3. **Refactor** — clean it up with the test holding you safe.

TDD's real payoff is not correctness — it is **design**. Writing the test first forces you to
use your own API before you build it, and painful-to-test code is nearly always badly designed
code: too many dependencies, hidden state, doing several jobs at once. The test is a design
review you get for free, before the code exists.

Where TDD earns its keep most: domain rules and bug fixes. **For a bug fix it is effectively
mandatory** — write the test that reproduces the bug first, watch it fail, then fix it.
Otherwise you have no evidence you fixed the thing you thought you fixed.

## See also

- [Definition of Done](05-definition-of-done.md) — tests are a gate, not a nicety
- [Architecture Guide](09-architecture.md) — why this architecture is easy to test
