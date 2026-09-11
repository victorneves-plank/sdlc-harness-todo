# 05 — Definition of Done

> **Status:** Binding. This is the checklist in the
> [PR template](../../.github/PULL_REQUEST_TEMPLATE.md).

"Done" is the most overloaded word in software. It means "I stopped typing", "it works on my
machine", "it's in review", "it's merged" and "it's in production" — usually to five different
people in the same standup.

This document fixes one meaning. **Done means every box below is ticked.** Not "mostly".
Not "done except for tests". There is no partial credit, because partial credit is how work
that looks finished accumulates into a release nobody can ship.

## The checklist

### Correctness

- [ ] The change does what the issue asked, and nothing the issue did not ask for.
- [ ] Edge cases are handled deliberately: empty input, missing resource, boundary values,
      duplicate submission, concurrent modification.
- [ ] Errors are handled at the layer that can do something useful about them, and never
      silently swallowed.
- [ ] No `console.log`, no commented-out code, no unresolved `TODO` without a linked issue.

### Tests

- [ ] New behaviour has a test that **fails without the change**. (Confirm it: revert your
      fix, watch the test go red, restore it. A test that has never failed has never been
      shown to work.)
- [ ] Fixed bugs have a **regression test that reproduces the original defect**. This is
      non-negotiable — an untested bug fix is a bug scheduled for reintroduction.
- [ ] Tests assert on **observable behaviour**, not on internal structure.
- [ ] The full suite passes locally: `npm test`.

### Code health

- [ ] The code follows the [coding standards](08-coding-standards.md): small functions,
      honest names, no needless duplication, no speculative generality.
- [ ] The [dependency rule](09-architecture.md#the-dependency-rule) holds — the domain
      imports nothing from infrastructure.
- [ ] You left the surrounding code at least as clean as you found it. Opportunistic
      refactoring is welcome; **unrelated** refactoring belongs in its own PR.
- [ ] `npm run verify` passes: lint, typecheck, test, build.

### Documentation

- [ ] Public functions and types that are not self-evident carry a doc comment saying **why**.
- [ ] If behaviour a user can observe changed, the README or relevant doc is updated **in
      the same PR**. Documentation updated later is documentation never updated.
- [ ] If a significant technical decision was made, an [ADR](../adr/) is added.
- [ ] The CHANGELOG entry is implied by a correct Conventional Commit title — verify the
      type is right.

### Pull request hygiene

- [ ] Title follows [Conventional Commits](02-commit-convention.md).
- [ ] Description explains **why**, not only what.
- [ ] Under 400 lines changed, or the size is justified in the description.
- [ ] You have **read your own diff in the GitHub UI**.
- [ ] Screenshot or recording attached for any visible UI change.
- [ ] The issue is linked (`Closes #n`).

### Green gates

- [ ] CI is green. Not "green except the flaky one" — green.
- [ ] Branch is up to date with `develop`.
- [ ] All review conversations resolved.

## On "definitely not done"

Some specific things that are **not** done, however finished they feel:

| Sounds done | Actually |
| --- | --- |
| "It works, I'll add tests in a follow-up" | Not done. The follow-up has a ~30% survival rate, and it is 0% once the next priority lands. |
| "CI is red but it's unrelated" | Not done. Either it is related and you broke it, or the pipeline is lying to everyone and **that** is now the priority. |
| "The docs are slightly out of date now" | Not done. Wrong documentation is worse than absent documentation, because people trust it. |
| "I disabled the lint rule to get it through" | Not done, unless the disable has a comment explaining why and is scoped to the single line. |
| "It's behind a feature flag so it doesn't matter" | The flag changes the *risk*, not the *standard*. Unfinished code behind a flag is still unfinished code you now have to maintain. |

## Why this is strict

Every item above is cheap now and expensive later, and the multiplier is brutal. A missing
test costs ten minutes today and a production incident in eight months. A stale README costs
one line today and an hour of a new joiner's confusion, repeatedly, forever.

This is what Uncle Bob means by the
[Boy Scout Rule](08-coding-standards.md#the-boy-scout-rule) and what Fowler means by keeping
a **healthy mainline**: the mainline is only releasable if *every* change that entered it was
complete. One incomplete merge and `develop` is no longer trunk — it is a branch that needs
stabilising before it can ship. The whole model rests on this checklist being honoured when
nobody is watching.

## See also

- [Pull Request Guide](03-pull-request-guide.md)
- [Testing Strategy](06-testing-strategy.md)
