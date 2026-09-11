# 03 — Pull Request Guide

> **Status:** Binding. The title grammar is enforced by CI; the rest is enforced by reviewers.

A pull request is not a delivery mechanism. It is an **argument**: *"this change is correct,
it is necessary, and here is the evidence."* Your reviewer's job is to evaluate that argument.
Everything below exists to make the argument easy to evaluate.

## Size: the rule everybody breaks

**Target: under 400 lines changed. Hard ceiling: 800.** Above that, split it or justify it
in the description.

This is not arbitrary. Google's [Small CLs](https://google.github.io/eng-practices/review/developer/small-cls.html)
guidance and the code-review research behind it converge on the same finding: **review
effectiveness collapses as size grows**. Defect detection per line falls off a cliff somewhere
around 200–400 lines, and reviewers of very large PRs reliably produce *fewer* comments in
total than reviewers of small ones — not because the code is better, but because they have
stopped genuinely reading it and started pattern-matching.

The large-PR failure mode is specific and recognisable:

> A reviewer opens a 2,000-line PR, skims it, leaves four comments about naming, and approves.
> Nobody caught the race condition on line 1,140. **The review happened. It did not work.**

Practical ways to stay small:

- **Separate refactoring from behaviour change.** A PR that both moves code and changes what
  it does is unreviewable, because the reviewer cannot tell which diff lines are which. Move
  first (pure `refactor:`, tests unchanged and passing), then change (`feat:`/`fix:`). Two
  small reviewable PRs instead of one large unreviewable one.
- **Land the interface before the implementation.** Types, signatures and a failing test in
  PR one; the body in PR two.
- **Merge inert code.** Code that compiles, is tested, and is not yet wired to anything is
  safe to merge and shrinks the next PR.
- **Never mix formatting with logic.** A reformat touching 60 files buries the three lines
  that matter. If you must reformat, do it in its own `style:` PR.

**When large is legitimate:** generated code, a dependency lockfile, a mechanical rename
across many files, or a genuinely atomic change that cannot be decomposed. Say so in the
description — *"1,400 lines, of which 1,310 are the regenerated OpenAPI client; the hand-written
change is in `src/todo/client.ts`"* — and point the reviewer at the part that needs their brain.

## Title grammar

**The PR title becomes the squash commit on `develop`.** It is permanent. It follows
[Conventional Commits](02-commit-convention.md) exactly:

```
<type>(<scope>): <description>
```

Validated in CI by `.github/workflows/pr-title.yml`. A malformed title blocks the merge.

| ❌ | ✅ |
| --- | --- |
| `Todo improvements` | `feat(web): add inline editing for todo titles` |
| `Fix bug #42` | `fix(api): reject todo titles longer than 200 characters` |
| `feat(web): Added the new filter component.` | `feat(web): filter todos by completion status` |
| `WIP` | *(Use a draft PR. Draft PRs are exempt from the title check until marked ready.)* |

## Description: the contract

The [template](../../.github/PULL_REQUEST_TEMPLATE.md) is filled in automatically. Do not
delete sections — write "N/A" and a reason. An empty section reads as "I did not think about
this"; "N/A — no user-visible change" reads as "I thought about this and it does not apply."

### Why

**The most important section, and the one most often skipped.** What problem does this solve?
What happens if we merge nothing? Link the issue, but do not *only* link the issue — the
reviewer should not have to open another tab to understand whether the change is worth making.

If you cannot articulate why in two sentences, you may be solving a problem nobody has. That
is [YAGNI](08-coding-standards.md#yagni--you-arent-gonna-need-it), and catching it here is
enormously cheaper than catching it in production.

### What

What changed, at the level of *design*, not diff. "Extracted the completion rule into the
`Todo` entity so both the HTTP handler and the future CLI enforce it identically" — not
"modified `todo.ts` and `handler.ts`".

### How to verify

Give the reviewer a path to conviction that is not "read every line and trust me":

- The exact commands to run it (`npm run dev`, then `curl -X POST …`)
- What they should see
- Which automated test covers the new behaviour, by name
- A screenshot or short recording for UI changes — **always**, for UI changes

### Trade-offs and alternatives

What you considered and rejected, and why. This is the section that turns a PR from a request
for rubber-stamping into an actual technical conversation. It also pre-empts the single most
common review comment: *"why didn't you just…?"*

### Risk

What could break. What is not covered by tests. What you are least sure about. **Naming your
own weak spot is not a confession, it is the highest-value thing in the description** — it
directs scarce reviewer attention exactly where it pays off, and it is the clearest signal
of an engineer worth trusting.

## Draft PRs

Open a draft as soon as you have something to discuss — the direction, a shape, an API. It
is far cheaper to be told "wrong approach" at 50 lines than at 500. Drafts are exempt from
the title check and cannot be merged.

Mark it ready only when the [Definition of Done](05-definition-of-done.md) is satisfied.

## Before you request review

```bash
npm run verify   # lint + typecheck + test + build — the same gate CI runs
```

Then, non-negotiably: **read your own diff on GitHub, top to bottom.** Not your editor — the
GitHub diff view, the way your reviewer will see it. You will find a stray `console.log`, a
commented-out block, a file you did not mean to touch, a TODO you meant to resolve. Finding
these yourself costs two minutes. Having a reviewer find them costs a round trip of hours
and a little of your credibility.

Leave review comments on your own PR wherever context helps — *"this cast is ugly; the
upstream type is wrong and I've filed #58"*. Self-review is the cheapest quality gate in
existence, and it is free.

## Responding to review

- **Reply to every comment.** "Done" is a complete reply. Silence is not.
- **Push fixes as new commits** during review, never as a force-push — force-pushing destroys
  the reviewer's ability to see "what changed since I last looked", which is the single thing
  they need most on a second pass. The squash merge tidies it all up anyway.
- **Disagreement is fine, and expected.** Explain your reasoning. If you and the reviewer
  cannot converge, escalate to a third opinion rather than to attrition. Google's
  [standard](https://google.github.io/eng-practices/review/reviewer/standard.html) is the
  right tiebreaker: the reviewer should approve once the change **definitely improves overall
  code health**, even if it is not perfect. "Not perfect" is not a valid block. "Makes things
  worse" is.
- **Resolve conversations you have addressed.** Branch protection requires it, and it lets
  the reviewer see at a glance what still needs their attention.

## Merging

Squash merge only — it is the only strategy the repository allows. Confirm the squash commit
message before you click: GitHub pre-fills it with the PR title and a list of your in-branch
commits. **Delete the commit list.** Replace it with a real body if the change deserves one.

The branch deletes itself on merge. Let it.

## See also

- [Code Review Standard](04-code-review-standard.md) — the other side of this conversation
- [Definition of Done](05-definition-of-done.md) — when a PR is allowed to leave draft
