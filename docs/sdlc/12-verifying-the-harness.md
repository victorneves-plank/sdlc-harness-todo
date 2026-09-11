# 12 — Verifying the Harness

> **Status:** A procedure, not a rule. Run it after changing any gate, and once a quarter
> otherwise.

Every other document here describes what the process **is**. This one describes how to check it
still **works**. Those are different things, and the difference is where process quietly rots.

## Why this exists

A gate can stop firing without anything going red. That is not hypothetical — each of these has
already happened in this repository:

| What happened | How it would have looked |
| --- | --- |
| The ESLint dependency-rule globs were written against a directory layout that did not exist yet | Lint passes. The rule matches nothing and permits exactly what it exists to forbid |
| `subject-case` was set to `lower-case`, rejecting every proper noun | The hook rejects `add TypeScript config`; everyone learns to use `--no-verify` |
| A conflicting PR could not have its merge commit computed | **No PR-triggered checks ran at all.** The PR displayed a green `Verify` inherited from a push to the base branch |

The third is the dangerous one and the reason this document is not optional. A gate that **fails
open** is worse than no gate, because it provides confidence in proportion to how thoroughly it
is not working.

> **The rule of thumb: a gate nobody has watched fail is a gate nobody knows works.**

Each section below breaks something on purpose, shows what firing correctly looks like, and
restores. The whole run takes about ten minutes.

---

## Before you start

```bash
git checkout develop && git pull
npm ci
npm run verify          # must be green before you start breaking things
git status --porcelain  # must be empty
```

If `verify` is red before you begin, you are debugging that, not this.

---

## 1. Commit-message grammar

**Gate:** `.husky/commit-msg` → commitlint. **Fires:** locally, before the commit exists.

```bash
git checkout -b test/harness
echo scratch > scratch.txt && git add scratch.txt

git commit -m "Added some stuff."
git commit -m "feat: Add a thing"
git commit -m "feat(payments): add it"
git commit -m "feat: add a scratch file that exists purely to prove the hook rejects headers over seventy-two chars"
```

**Expected — all four rejected, each naming its rule:**

```
✖   subject may not be empty [subject-empty]
✖   subject may not end with full stop [subject-full-stop]
✖   type may not be empty [type-empty]

✖   subject must not be sentence-case, start-case, pascal-case, upper-case [subject-case]

✖   scope must be one of [api, web, domain, deps, deps-dev, ci, docs, repo, release] [scope-enum]

✖   header must not be longer than 72 characters, current length is 100 [header-max-length]
```

Then confirm a valid message is accepted — a hook that rejects everything is equally broken:

```bash
git commit -m "chore: add a scratch file"     # accepted
```

**Restore:**

```bash
git checkout develop && git branch -D test/harness && rm -f scratch.txt
```

**If it does not fire:** the hooks are not installed. `npm ci` runs `prepare` → `husky`; a
`git clone` followed by `npm ci --ignore-scripts` silently leaves you unprotected.

---

## 2. Branch protection

**Gate:** GitHub branch protection on `main` and `develop`. **Fires:** on push, server-side.

```bash
git checkout develop
git commit --allow-empty -m "chore: try to bypass review"
git push origin develop
```

**Expected — rejected:**

```
remote: - Changes must be made through a pull request.
remote: - 2 of 2 required status checks are expected.
 ! [remote rejected] develop -> develop (protected branch hook declined)
```

**Restore:**

```bash
git reset --hard origin/develop
```

**Check the wording carefully.** If it says `Bypassed rule violations` instead of
`remote rejected`, the push **succeeded** — `enforce_admins` is off and the rules do not apply to
you. Verify:

```bash
gh api repos/victorneves-plank/sdlc-harness-todo/branches/develop/protection \
  --jq '{admins: .enforce_admins.enabled, checks: .required_status_checks.contexts}'
# → {"admins":true,"checks":["Verify","Conventional Commits"]}
```

This repository learned that distinction the hard way: the first protection test reported a
violation *and pushed anyway*, leaving a stray commit on `develop` that cannot be removed without
force-push, which protection also forbids.

---

## 3. The architecture dependency rule

**Gate:** ESLint `no-restricted-imports`. **Fires:** locally and in CI.

This is the one most worth re-running, because it is the one that fails open. The rules are
path globs; move a directory and they match nothing, silently.

```bash
# backend: the domain must not know infrastructure exists
sed -i '' "1i\\
import { InMemoryTodoRepository } from '../../infrastructure/todo/in-memory-todo.repository.js'
" apps/api/src/domain/todo/todo.ts
npx eslint apps/api/src/domain/todo/todo.ts
git checkout apps/api/src/domain/todo/todo.ts
```

```bash
# frontend: shared/ must not know features exist
sed -i '' "1i\\
import { type Todo } from '../../features/todo/types'
" apps/web/src/shared/components/button.tsx
npx eslint apps/web/src/shared/components/button.tsx
git checkout apps/web/src/shared/components/button.tsx
```

**Expected — both rejected, with the reasoning, not just a rule name:**

```
error  '../../infrastructure/todo/in-memory-todo.repository.js' import is restricted from
       being used by a pattern. The domain layer must not depend on anything outside itself.
       It holds the rules; storage, HTTP and frameworks are details.
       See docs/sdlc/09-architecture.md              no-restricted-imports

error  '../../features/todo/types' import is restricted from being used by a pattern.
       shared/ must not depend on any feature. The dependency points the other way
                                                    no-restricted-imports
```

Also worth testing the *other* direction, which must stay legal — a rule that forbids too much is
as broken as one that forbids too little:

```bash
# infrastructure importing domain is CORRECT and must pass
npx eslint apps/api/src/infrastructure/todo/in-memory-todo.repository.ts   # no findings
```

**If it does not fire:** the globs in `eslint.config.js` no longer match the tree.
[ADR-0002](../adr/0002-clean-architecture-in-the-api.md) chose this architecture *because* the
rule is enforceable — if the rule is dead, that ADR needs revisiting, not quietly patching.

---

## 4. Does the test suite catch a regression?

**Gate:** Vitest. **Fires:** locally and in CI.

Coverage percentages tell you which lines *executed*, not whether anything was *checked*. The
only real test is to introduce a bug and watch something go red.

```bash
sed -i '' 's/if (title.length === 0)/if (false)/' apps/api/src/domain/todo/todo.ts
npm test
git checkout apps/api/src/domain/todo/todo.ts
```

**Expected — failures at every layer that depends on the rule:**

```
× Todo > creation > rejects a title that is empty
  → expected function to throw an error, but it didn't
× Todo > creation > rejects a title that is only whitespace
× Todo > retitling > applies the same validation as creation
× todo use cases > CreateTodo > propagates the domain rule rather than storing an invalid todo
× todo routes > POST /api/todos > returns 400 INVALID_TITLE for a title that is only whitespace
```

**Failing at more than one layer is the point.** The domain test proves the rule is wrong; the
route test proves the wrongness reaches a user. If only the domain test had failed, the HTTP
layer would be re-implementing the rule instead of delegating to it — which is the duplication
[the coding standards](08-coding-standards.md#dry--dont-repeat-yourself) warn about, and this is
how you detect it.

Other rules worth breaking the same way — both verified to fail as described:

| Break | Expected failures |
| --- | --- |
| Make `RemoveTodo.execute` call `this.todos.remove(id)` without throwing | `throws rather than silently succeeding for an unknown id` **and** `returns 404 TODO_NOT_FOUND for an unknown id` |
| `TITLE_MAX_LENGTH` 200 → 500 | `caps titles at the 200 characters the API contract documents` |

### A finding this document produced on its first run

The `TITLE_MAX_LENGTH` break above originally caused **zero failures**, and that is worth
understanding because the mistake is extremely easy to repeat.

The boundary tests looked thorough:

```ts
it(`accepts a title of exactly ${TITLE_MAX_LENGTH} characters`, () => {
  const title = 'a'.repeat(TITLE_MAX_LENGTH)
  expect(Todo.create({ title }).title).toBe(title)
})
```

They derive their input **from the constant they are testing**, so changing 200 to 500 moves the
test along with it and everything stays green. They verify that the boundary *logic* works; they
say nothing about where the boundary *is* — which is the part the API contract documents and
clients depend on.

The fix was one explicit assertion, `expect(TITLE_MAX_LENGTH).toBe(200)`, so that changing the
documented limit fails exactly one test and forces a deliberate decision rather than slipping
through.

**Generalise this.** A test that computes its expectation from the code under test cannot fail.
It is the same family as asserting a mock was called with what you just passed it: it will be
green forever, including while production is broken. When breaking something produces no
failures, do not conclude the code is fine — look for the tautology.

---

## 5. The PR title gate

**Gate:** `.github/workflows/pr-title.yml`. **Fires:** on GitHub only — there is no local
equivalent, which is exactly why it needs checking.

```bash
git checkout -b test/harness-pr
git commit --allow-empty -m "chore: test the pr title gate"
git push -u origin test/harness-pr
gh pr create --base develop --title "some changes" --body "testing the title gate"
gh pr checks --watch
```

**Expected — `Conventional Commits` fails and the merge is blocked:**

```
Conventional Commits   fail
::error::Title does not match the Conventional Commits format.
Expected:  <type>(<scope>): <imperative, lowercase, no full stop>
```

Now fix the title **without touching the code**:

```bash
gh pr edit --title "chore: verify the pr title gate rejects bad titles"
gh pr checks --watch      # goes green, no new commit
```

That is the whole reason this gate blocks while the per-commit check only warns: with squash
merges the **title**, not your commits, becomes the permanent history on `develop`.

**Restore:**

```bash
gh pr close <n> --delete-branch
```

---

## 6. The one that has no gate: a check that never ran

There is no command for this. It is a thing to look for, and it is the failure this repository
actually hit.

**A pull request with merge conflicts cannot have its merge commit computed, so GitHub runs no
PR-triggered workflows on it.** The required checks do not fail — they never start. The PR then
displays whatever status the base branch's last push produced, which can be green and entirely
unrelated to the PR's contents.

On PR #18 this produced a green `Verify` inherited from a push to `main`. Branch protection was
correctly configured and correctly enforced, and it still would have permitted a merge that had
been verified of nothing, had the conflicts been resolvable.

**How to spot it.** Before merging anything, confirm the checks belong to the PR:

```bash
gh pr view <n> --json mergeable,mergeStateStatus,statusCheckRollup \
  --jq '{mergeable, state: .mergeStateStatus,
         checks: [.statusCheckRollup[] | {name: (.name // .context), r: (.conclusion // .state)}]}'
```

Two things to read:

- **`mergeable: "CONFLICTING"`** — resolve the conflict before trusting any check on the PR.
- **A missing check is not a passing check.** If `Conventional Commits` is absent from the list
  rather than present and green, it did not run. Compare against a healthy PR, which shows all
  four: `Verify`, `Conventional Commits`, `Commit messages`, `Dependency audit`.

The general lesson is worth more than the specific bug: **when auditing gates, look for checks
that are missing, not only for checks that are red.** Absence renders as "nothing wrong".

---

## After the run

```bash
git status --porcelain    # must be empty
npm run verify            # must be green
```

If either is not, a restore step above was missed. Nothing in this document should leave a trace.

## When to run this

- **After changing any gate** — a lint rule, a workflow, the commitlint config, branch protection.
- **After moving directories.** The dependency rules are path globs; a rename can silently kill
  them, and section 3 is the only thing that would tell you.
- **After a dependency major bump.** ESLint, commitlint and Vitest have all changed config
  formats across majors. A tool that fails to load a rule is not always loud about it.
- **Quarterly otherwise**, or whenever you notice you have not seen a gate fail in a while.

## See also

- [Definition of Done](05-definition-of-done.md) — the gate that is enforced by you, not by tooling
- [Code Review Standard](04-code-review-standard.md) — every review comment you could have
  automated is a bug in your tooling
