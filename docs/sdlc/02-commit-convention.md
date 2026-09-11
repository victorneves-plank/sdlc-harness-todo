# 02 — Commit Convention

> **Status:** Binding, and mechanically enforced by `commitlint` via a Husky `commit-msg` hook.
> **Specification:** [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)

## Why bother

A commit message is the only place where the *intent* behind a change survives. The diff
tells you **what** changed; `git blame` tells you **who**; the message is the sole record
of **why** — and "why" is the thing you will be desperate for at 2am eighteen months from now.

Conventional Commits adds one further benefit: the message becomes **machine-readable**.
That single constraint unlocks automatic SemVer bumps, automatic CHANGELOG generation, and
the ability to answer "what breaking changes shipped in v2?" with a query instead of an
archaeology expedition.

## The format

```
<type>[optional scope][!]: <description>

[optional body]

[optional footer(s)]
```

A minimal valid commit:

```
fix: reject todo titles consisting only of whitespace
```

A complete one:

```
feat(api): add PATCH endpoint for toggling todo completion

The UI needed a way to flip a todo's completed flag without resending the
whole resource. A full PUT would have required the client to hold and
retransmit state it does not own, which invites lost-update bugs when two
tabs are open.

PATCH /todos/:id/completion takes { completed: boolean } and returns the
updated todo. The handler delegates to ToggleTodoCompletion in the
application layer; no domain rules live in the route.

Closes #42
```

## Types

| Type | Meaning | SemVer impact | In CHANGELOG |
| --- | --- | --- | --- |
| `feat` | A new capability for the user | **MINOR** | ✅ Features |
| `fix` | A defect repair | **PATCH** | ✅ Bug Fixes |
| `perf` | A change that improves performance | PATCH | ✅ Performance |
| `refactor` | Restructuring with **no** behaviour change | — | ❌ |
| `docs` | Documentation only | — | ❌ |
| `test` | Adding or correcting tests only | — | ❌ |
| `build` | Build system, bundler, or dependencies | — | ❌ |
| `ci` | CI configuration and workflows | — | ❌ |
| `style` | Formatting, whitespace, semicolons — no code meaning changes | — | ❌ |
| `chore` | Maintenance that fits nothing above | — | ❌ |
| `revert` | Reverts a previous commit | — | ✅ Reverts |

Any commit with a `BREAKING CHANGE:` footer or a `!` before the colon triggers a **MAJOR**
bump regardless of its type.

### Choosing between `feat`, `fix` and `refactor`

This trips people up, so the test is: **would a user notice?**

- A user would notice something *new* → `feat`
- A user would notice something *wrong becoming right* → `fix`
- A user would notice **nothing at all** → `refactor`

If your `refactor` commit changes a test's expected value, it is not a refactor. Refactoring
is *"a change to the internal structure of software to make it easier to understand and
cheaper to modify **without changing its observable behaviour**"* (Fowler,
[Refactoring](https://refactoring.com/)). The tests are the definition of observable behaviour.
If they had to change, you changed behaviour — pick `feat` or `fix`.

## Scopes

The scope names the part of the codebase affected. In this monorepo the allowed scopes are
enforced by commitlint:

| Scope | Covers |
| --- | --- |
| `api` | `apps/api` — the backend |
| `web` | `apps/web` — the frontend |
| `domain` | Domain-layer changes specifically |
| `deps` | Dependency version bumps |
| `ci` | Workflows and pipeline config |
| `docs` | The `docs/` tree |
| `repo` | Root-level tooling and configuration |

Scope is optional. Omit it when a change genuinely spans everything (`chore: bump Node to 22`).
Do **not** invent a scope to look thorough — a wrong scope is worse than no scope, because
tooling trusts it.

## Writing the description

Rules, all enforced:

1. **Imperative mood.** `add`, not `added` or `adds`. Read it as completing the sentence
   *"If applied, this commit will …"*. This is not pedantry — it is the convention `git merge`,
   `git revert` and `git cherry-pick` already use for their generated messages, so imperative
   is what makes your history read consistently.
2. **Lowercase first letter.** `feat: add x`, not `feat: Add x`.
3. **No trailing period.** It is a subject line, not a sentence.
4. **72 characters maximum**, including the type and scope.
5. **Say what changed, not which file changed.** Git already knows the filenames.

| ❌ Poor | ✅ Better |
| --- | --- |
| `fix: bug` | `fix(api): return 404 instead of 500 for unknown todo id` |
| `feat: updated TodoList.tsx` | `feat(web): show an empty state when no todos exist` |
| `chore: stuff` | `chore(deps): upgrade vitest from 2.1 to 3.0` |
| `fix: Fixed the thing.` | `fix(domain): trim whitespace before validating title length` |
| `refactor: improvements` | `refactor(api): extract TodoRepository interface from the handler` |

## Writing the body

The body is **optional but usually right**. Skip it for genuinely self-evident changes
(`chore(deps): bump prettier to 3.4.0`). Write it whenever the change involved a *decision*.

Answer, in this order:

1. **What was the problem or need?** The state of the world before this commit.
2. **Why this solution?** Especially: what else did you consider, and why not that?
3. **What should a future reader watch out for?** Non-obvious consequences, follow-up work.

Do **not** re-describe the diff in prose. "Added a function called `validateTitle` that
validates the title" is noise — the reader can see that. The body exists for what the diff
*cannot* show: the reasoning you discarded, the constraint you were working around, the
bug you were avoiding.

Wrap the body at 72–100 characters. Blank line between the subject and the body, always —
this is not cosmetic, it is how Git itself distinguishes subject from body.

## Footers

```
Closes #42
Refs #17
Co-Authored-By: Ada Lovelace <ada@example.com>
Reviewed-by: Grace Hopper <grace@example.com>
BREAKING CHANGE: TodoRepository.findAll now returns a readonly array
```

Footer tokens use hyphens instead of spaces (`Co-Authored-By`, not `Co Authored By`). The
sole exception is `BREAKING CHANGE`, which must be uppercase with a space.

Issue-closing keywords GitHub understands: `Closes`, `Fixes`, `Resolves`. Use `Refs` to
reference an issue *without* closing it.

## Breaking changes

Two equivalent notations — use both together when the change is significant:

```
feat(api)!: return todos newest-first instead of oldest-first
```

```
feat(api): return todos newest-first instead of oldest-first

BREAKING CHANGE: GET /todos previously returned todos in creation order.
Clients that relied on index 0 being the oldest todo must now sort
explicitly or read from the end of the array.
```

The `!` makes it visible at a glance in `git log --oneline`. The footer is what the
CHANGELOG generator extracts and what a consumer actually reads to plan their migration —
so the footer must describe **the migration**, not just the change.

## Enforcement

```
.husky/commit-msg  →  commitlint --edit $1
```

Rejected messages fail locally, before the commit exists. This is deliberate: the commit-msg
hook is the cheapest possible place to catch the problem, and rewriting history to fix a
message is far more annoying than retyping one.

CI additionally validates the **PR title** (see [Pull Request Guide](03-pull-request-guide.md)),
because with squash merges the PR title — not your individual commits — becomes the permanent
commit on `develop`.

**Escape hatch:** `git commit --no-verify` exists. Using it means the PR-title check catches
you instead. There is no path to `develop` that skips both.

## Commits inside a branch vs. the squashed commit

Because merges are squashed, your in-branch commits are **working notes**, not history. They
are still worth writing well — your reviewer reads them commit-by-commit to follow your
reasoning, and Google's [review guidance](https://google.github.io/eng-practices/review/)
is explicit that a reviewable sequence of small commits is far easier to evaluate than one
large blob. But they will not survive the merge.

The commit that survives is the **PR title**. Spend your care there.

## See also

- [Pull Request Guide](03-pull-request-guide.md) — the PR title *is* the permanent commit
- [Release & Versioning](07-release-and-versioning.md) — how these types become version bumps
