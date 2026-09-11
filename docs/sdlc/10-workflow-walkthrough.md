# 10 — Workflow Walkthrough

> **Status:** The runbook. If you read one document in this repository, read this one.

The complete loop, from "someone wants something" to "it is released", with the actual commands.

---

## 0. One-time setup

```bash
git clone https://github.com/victorneves-plank/sdlc-harness-todo.git
cd sdlc-harness-todo
npm install          # also installs the Husky hooks
npm run verify       # confirm a clean baseline before you change anything
```

---

## 1. An issue exists before a branch does

Every change starts as an issue. Not bureaucracy — it is where the *problem* gets separated
from the *solution*, and that separation is where most of the value in a good process lives.
An issue written as "add a dropdown" has already discarded the alternatives; one written as
"users cannot tell which todos are still outstanding" has not.

```bash
gh issue create --title "Users cannot filter todos by completion state" \
                --label "type: feature"
```

A good issue states:

- **The problem**, from the user's perspective
- **Why it matters** — what is the cost of not doing it
- **Acceptance criteria** — how we will know it is done
- **Out of scope** — what this issue explicitly does not cover

The [issue templates](../../.github/ISSUE_TEMPLATE/) prompt for all of these.

---

## 2. Branch from `develop`

```bash
git checkout develop
git pull origin develop          # ALWAYS. Branching from stale develop guarantees a merge later.
git checkout -b feat/filter-todos-by-status
```

**Start the two-day clock now.** See the
[branch lifetime cap](01-branching-strategy.md#1-branch-lifetime-is-capped-at-two-days).

If the work is obviously larger than two days, stop and decompose it *before* you write code.
Decomposing a plan is easy; decomposing a half-finished branch is miserable.

---

## 3. Work in small commits

```bash
# test first for anything with a rule in it
npm run test -- --watch

git add apps/api/src/domain/todo/todo.ts apps/api/src/domain/todo/todo.test.ts
git commit -m "feat(domain): add completion filter predicate to Todo"
```

The `commit-msg` hook validates the message. A malformed one is rejected before the commit
exists:

```
⧗   input: added filter stuff
✖   subject may not be empty [subject-empty]
✖   type may not be empty [type-empty]
```

Commit whenever something works, even partially. These commits are **working notes** — they
will be squashed. Their job is to let your reviewer follow your reasoning step by step, and
to give you cheap points to roll back to.

---

## 4. Open a draft PR early

Do this when you have a *shape*, not when you have a finished feature. Being told "wrong
direction" at 50 lines is cheap; at 500 it costs you a day and some morale.

```bash
git push -u origin feat/filter-todos-by-status
gh pr create --draft --base develop \
  --title "feat(web): filter todos by completion status" \
  --body "Early draft — does the filter belong in the hook or the component? See #12"
```

---

## 5. Keep up with `develop`

At least daily, and always before requesting review:

```bash
git fetch origin
git rebase origin/develop
# resolve conflicts, then:
git push --force-with-lease
```

**`--force-with-lease`, never bare `--force`.** The lease refuses the push if the remote moved
since you last fetched, which is the difference between a safe rewrite and silently destroying
someone else's commit.

Rebase (rather than merge) keeps the PR diff showing *only your change*, which is what makes
it reviewable.

---

## 6. Self-review, then request review

```bash
npm run verify       # lint + typecheck + test + build — exactly what CI runs
```

Then open the PR in the browser and **read your own diff**. Not in your editor — in the GitHub
diff view, the way your reviewer will see it. Leave comments on your own code where context
helps.

Fill in the template honestly. The **Risk** section — what you are least sure about — is the
highest-value thing you will write, because it aims scarce reviewer attention at the place it
actually pays.

```bash
gh pr ready
```

---

## 7. Review happens

The reviewer works to the [Code Review Standard](04-code-review-standard.md): approve once the
change **definitely improves overall code health**, even if imperfect.

As author:

- Reply to **every** comment; "Done" is a complete reply.
- Push fixes as **new commits**, never a force-push during review — the reviewer needs to see
  what changed since their last pass.
- Resolve the conversations you have addressed.
- Disagree when you should. Explain your reasoning; escalate to a third opinion rather than
  outlasting each other.

---

## 8. Merge

Squash merge — the only strategy this repo allows.

```bash
gh pr merge --squash --delete-branch
```

**Check the squash commit message before confirming.** GitHub pre-fills it with your PR title
plus a list of your in-branch commits. Delete the list; it is noise in permanent history.
Write a real body if the change deserves one.

`develop` now has one clean, semantic commit. The branch deletes itself.

```bash
git checkout develop && git pull
```

---

## 9. Release when there is something worth releasing

See [Release & Versioning](07-release-and-versioning.md) for the full detail.

```bash
git checkout develop && git pull && npm run verify

git checkout -b release/0.2.0
npm version 0.2.0 --workspaces --no-git-tag-version --include-workspace-root
# write CHANGELOG.md — for humans, grouped Added/Changed/Fixed
git commit -am "chore(release): 0.2.0"
git push -u origin release/0.2.0

gh pr create --base main --title "chore(release): 0.2.0" --body-file /tmp/release-notes.md
gh pr merge --squash --delete-branch

git checkout main && git pull
git tag -a v0.2.0 -m "Release 0.2.0"
git push origin v0.2.0
gh release create v0.2.0 --title "v0.2.0" --notes-file /tmp/release-notes.md

# and bring the release commit back
git checkout develop && git pull && git merge --ff-only main && git push
```

---

## The loop, compressed

```
issue → branch from develop → small commits → draft PR → rebase daily
      → verify → self-review → ready → review → squash merge → delete branch
      ↺ (repeat, ideally more than once per day)

      ⟹ release PR develop → main → tag → back-merge   (whenever worth shipping)
```

---

## Troubleshooting

**commitlint rejected my message.** Check type, lowercase subject, no trailing period, under
72 characters. `git commit --amend` to fix.

**The PR title check is failing.** Edit the PR title in the GitHub UI; the check re-runs
automatically. Draft PRs are exempt until marked ready.

**"Branch is out of date."** `git fetch origin && git rebase origin/develop && git push --force-with-lease`.

**A conflict during rebase.** Fix the files, `git add`, then `git rebase --continue`. Never
`git rebase --skip` unless you are certain you want to discard that commit. `git rebase --abort`
returns you safely to where you started.

**I committed to `develop` by accident.** The push is rejected by branch protection — good.
Move the work onto a branch:
```bash
git branch feat/my-work        # save the commits
git reset --hard origin/develop
git checkout feat/my-work
```

**CI is red but passes locally.** Check the Node version (CI uses the version in
`.nvmrc`), and check you have not committed something that is in your `.gitignore` locally
but not in CI. If it is a genuine flake, fix the flake — do not re-run until green. A test
you re-run until it passes is a test that no longer means anything.

## See also

- [Branching Strategy](01-branching-strategy.md)
- [Pull Request Guide](03-pull-request-guide.md)
- [Definition of Done](05-definition-of-done.md)
