# 04 — Code Review Standard

> **Status:** Binding for reviewers.
> **Primary source:** [Google Engineering Practices](https://google.github.io/eng-practices/review/)

## The standard

> **Approve once the change definitely improves the overall code health of the system, even
> if it is not perfect.**

This is the whole standard, borrowed verbatim in spirit from Google, and it resolves almost
every review dispute. There is **no such thing as a perfect change** — only better code. A
reviewer who blocks until a PR matches the version they would have written has stopped
improving the codebase and started imposing taste, at a real cost in delivery speed and
colleague goodwill.

The mirror of that rule matters just as much: **do not approve a change that makes the
codebase worse** because the author is senior, in a hurry, or persistent. "Approved, but
I have concerns" without those concerns written down is how codebases rot.

The balance point: *continuous improvement over perfection*.

## What to look for, in priority order

Review in this order. Spending your first fifteen minutes on naming and your last two on
correctness is the most common way a review fails.

### 1. Design — does this belong here, and in this shape?

The highest-value question, and the most expensive to fix later. Is this the right layer?
Does it respect the [dependency rule](09-architecture.md#the-dependency-rule)? Does it
duplicate something that exists? Is it more general than the problem requires
([YAGNI](08-coding-standards.md#yagni--you-arent-gonna-need-it))?

If the design is wrong, **say so immediately and stop reviewing line by line**. Detailed
comments on code that should be deleted waste everyone's time and make the redirection
harder to hear.

### 2. Functionality — does it do what it claims?

Does it match the description and the issue? Think about **edge cases that the author may
not have**: empty collections, concurrent access, a second browser tab, a 200-character
title, a deleted item being toggled. Consider the *user*, not just the calling code — for
UI changes, actually run it. Reading React is not the same as using it.

### 3. Tests — would they catch a regression?

Do they test **behaviour** or implementation detail? A test that breaks when you rename a
private method but survives when you invert a boolean is worse than no test, because it
costs maintenance and buys nothing. Ask: *"if I introduced the obvious bug here, would a
test go red?"* If not, the test is decorative.

### 4. Complexity — can the next person read this?

> "Can a developer who did not write this understand it quickly, and use it correctly?"

Over-engineering is complexity, and it counts here: solving tomorrow's hypothetical problem
today is one of the most common and most expensive forms of it.

### 5. Naming — do the names say what things are?

Uncle Bob's test: a good name makes the comment explaining it unnecessary. Names are the
highest-leverage cheap fix in review, because they are read hundreds of times and cost
seconds to change.

### 6. Comments and documentation — do they explain *why*?

Comments should explain **why**, never **what**. A comment restating the code is a maintenance
liability that will drift out of date and then actively lie to a future reader. Delete those.
Keep the ones explaining a non-obvious constraint, a rejected alternative, or a workaround.

### 7. Style and consistency — does it look like the rest of the codebase?

Lowest priority, because **most of it should not be your job at all**. Formatting is
Prettier's job; lint rules are ESLint's job. If you are leaving formatting comments, fix
the tooling instead — a linter never gets tired, never gets it wrong, and never makes anyone
feel criticised.

## Comment taxonomy

Prefix every comment with its severity. This is a small convention with an outsized effect:
it removes the author's guesswork about which comments block the merge, which is the single
largest source of review friction.

| Prefix | Meaning | Blocks merge? |
| --- | --- | --- |
| `[blocking]` | Must be addressed before merge | **Yes** |
| `[should]` | Strong recommendation; discuss if you disagree | Usually |
| `[nit]` | Minor preference. Take it or leave it | **No** |
| `[question]` | I want to understand, not necessarily to change | No |
| `[praise]` | This is good and I want to say so | No |
| `[future]` | Out of scope here; worth an issue | No |

Examples:

```
[blocking] This mutates the array returned by findAll(), so a second caller
sees the mutation. Return a copy, or make the return type readonly.

[should] This branch is unreachable — `status` is a union of three values and
all three are handled above. Suggest deleting it rather than leaving dead code.

[nit] `t` → `todo`. Single-letter names outside a tight loop cost more than
they save.

[question] Why `Number.parseInt` here rather than the zod schema used
everywhere else? Not objecting, just want to know if there's a reason I'd hit.

[praise] Extracting the validation into the entity is exactly right — nice
that the handler is now just plumbing.

[future] This would be much simpler once we have the shared error type from
#33. Not for this PR.
```

**`[praise]` is not padding.** Review is otherwise a stream of unbroken criticism, which is
corrosive over months. Naming what is good also teaches: it tells the author which of their
instincts to repeat, which negative feedback alone never does.

## Speed

**Respond within one working day.** Not necessarily a full review — an acknowledgement with
an ETA counts.

Review latency is the dominant hidden cost in most delivery pipelines. A PR waiting two days
is not merely delayed by two days: the author has context-switched away, the branch is drifting
from `develop`, and the [two-day branch cap](01-branching-strategy.md#1-branch-lifetime-is-capped-at-two-days)
is being consumed by *queueing* rather than work. Slow review is what silently converts a
trunk-based model into a feature-branch model.

If you are deep in focused work, do not interrupt it — but review at your next natural break.
Batching reviews at a couple of fixed points in the day is fine and usually better than
context-switching on every notification.

## How to write comments people can act on

- **Explain the reasoning, not just the instruction.** "Use a `Map` here" teaches nothing;
  "this is O(n²) over a list that grows with user input — a `Map` makes it O(n)" teaches a
  principle the author will apply next time unprompted.
- **Criticise the code, never the person.** "This function does three things" — not "you
  always write functions that do three things."
- **Ask rather than assert when you might be wrong.** "What happens if `todos` is empty here?"
  is better than "this crashes on empty input" when you have not checked. You will be wrong
  sometimes, and asking costs you nothing when you are.
- **Offer the alternative.** A comment that identifies a problem without a direction leaves
  the author stuck.
- **Label the theoretical.** If you are raising something that will not happen in practice,
  say so and mark it `[nit]` or `[future]`.

## Reviewing your own PR

Self-review is mandatory (see the [PR guide](03-pull-request-guide.md#before-you-request-review)).
Read your own diff in the GitHub UI before requesting review. The context switch from "author"
to "reader" is genuinely effective — you will catch things you were blind to while writing.

## What reviewers are *not* responsible for

Reviewers are not a substitute for CI. If a reviewer has to check formatting, type errors,
lint violations or a failing test, the pipeline has failed and the fix belongs in the pipeline.
**Every review comment you could have automated is a bug in your tooling.**

## See also

- [Pull Request Guide](03-pull-request-guide.md) — the author's side
- [Coding Standards](08-coding-standards.md) — the principles you are reviewing against
- [Definition of Done](05-definition-of-done.md) — the checklist before review begins
