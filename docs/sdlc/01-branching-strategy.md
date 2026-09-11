# 01 — Branching Strategy

> **Status:** Binding. Deviations require an ADR.
> **Decision record:** [ADR-0001](../adr/0001-trunk-based-development-with-a-release-branch.md)

## The model in one picture

```
  ┌──────────────────────────────────────────────────────────────────┐
  │                                                                  │
  │   main      ──●───────────────────────●──────────────────●────   │  release-ready
  │               ▲ v0.1.0                ▲ v0.2.0           ▲       │  (Maturity Branch)
  │               │ release PR            │                  │       │
  │   develop   ──●──●──●──●──●──●──●──●──●──●──●──●──●──●───●────   │  THE TRUNK
  │                  ▲     ▲     ▲           ▲     ▲                 │
  │                  │     │     │           │     │                 │
  │   short-lived    └─┐ ┌─┘   ┌─┘         ┌─┘   ┌─┘                 │
  │   branches         ●─●     ●─●─●       ●─●   ●                   │  < 2 days each
  │                                                                  │
  └──────────────────────────────────────────────────────────────────┘
```

## The three branch kinds

### `develop` — the trunk

`develop` is the **mainline** in Fowler's sense: *"a single, shared branch that acts as
the current state of the product."* Every piece of work starts from `develop` and returns
to `develop`. It is the branch against which "is the build green?" is a meaningful question.

- Always **healthy**: every commit on it builds, type-checks, lints and passes tests.
- Nobody pushes to it directly. Change arrives only through a reviewed, CI-green pull request.
- Merges are **squashed**, so `develop`'s history is one commit per pull request.

### `main` — the release-ready maturity branch

`main` is not a second place to develop. It is a **pointer to what is released**. Fowler
calls this a [Maturity Branch](https://martinfowler.com/articles/branching-patterns.html#maturity-branch):
its head is the latest code that has reached the "released" stage.

- `main` only ever receives commits from `develop`, via a **release pull request**.
- Every commit on `main` is tagged `vX.Y.Z`.
- **`main` is never merged into `develop`.** Because release PRs are squash-merged, no commit on
  `main` is an ancestor of `develop` and such a merge reports every file as an add/add conflict.
  The release commit is brought back by [cherry-pick](07-release-and-versioning.md#6-bring-the-release-commit-back-to-develop)
  instead.

### Short-lived working branches

Everything else. Created from `develop`, merged into `develop`, then deleted automatically.

| Prefix | Use for | Example |
| --- | --- | --- |
| `feat/` | A new user-visible capability | `feat/todo-completion-toggle` |
| `fix/` | A defect repair | `fix/empty-title-accepted` |
| `refactor/` | Behaviour-preserving restructuring | `refactor/extract-todo-repository` |
| `docs/` | Documentation only | `docs/review-standard` |
| `chore/` | Tooling, dependencies, config | `chore/upgrade-vite-7` |
| `test/` | Tests only | `test/todo-service-edge-cases` |
| `perf/` | Performance work | `perf/memoise-todo-list` |
| `release/` | A release PR into `main` | `release/0.2.0` |
| `hotfix/` | Urgent production repair (see below) | `hotfix/0.1.1-crash-on-empty-list` |

Naming rules: lowercase, kebab-case, no issue numbers in the branch name (the PR links
the issue). Keep it to a readable phrase — the branch name is read by humans in `git branch`
listings and in the GitHub UI, and it should say what the change *does*.

## The rules that actually matter

### 1. Branch lifetime is capped at two days

**Target: less than one day. Hard ceiling: two days.** This is the single most important
rule in this document, and it is the one people quietly break.

The [DORA research](https://dora.dev/) consistently finds branch lifetime under a day
among the strongest correlates of elite delivery performance. Fowler's explanation of *why*
is the part worth internalising: long-lived branches create **integration fear**, and
integration fear is self-reinforcing. The longer you wait, the scarier the merge; the
scarier the merge, the longer you wait. Short branches break the loop.

If a branch is about to exceed two days, you do **not** extend it. You do one of:

- **Split it.** Merge the part that is already safe and coherent; continue on a fresh branch.
- **Hide it.** Merge the incomplete work behind a
  [feature toggle](https://martinfowler.com/articles/feature-toggles.html) or simply
  unrouted/unexported, so it is integrated but inert.
- **Abstract it.** Use
  [Branch by Abstraction](https://martinfowler.com/bliki/BranchByAbstraction.html) for
  large replacements: introduce a seam, move callers one at a time, delete the old path last.

> **Integration frequency is decoupled from feature size.** A three-week feature does not
> justify a three-week branch. It justifies fifteen branches.

### 2. Rebase before you merge, never rewrite shared history

Update your branch with `git fetch origin && git rebase origin/develop`. This keeps the
PR diff honest — it shows only your change, not a tangle of merge commits.

Force-push is permitted **on your own working branch only** (`--force-with-lease`, never
bare `--force`). Force-push to `develop` or `main` is prohibited by branch protection.

### 3. One squashed commit per pull request

The PR title becomes the squash commit subject, which is why the
[PR title grammar](03-pull-request-guide.md#title-grammar) is enforced by CI. This gives
`develop` a clean, linear, semantic history where every commit corresponds to exactly one
reviewed unit of change — which is what makes automated CHANGELOG generation possible.

Inside your branch, commit as messily and as often as you like. The squash cleans up after you.

### 4. Hotfixes branch from `main`, and land in both places

A hotfix is for a defect in **released** code that cannot wait for the next normal release.

```bash
git checkout main && git pull
git checkout -b hotfix/0.1.1-crash-on-empty-list
# ...fix, test...
# PR into main, tagged v0.1.1 on merge
# then immediately:
git checkout develop && git pull
git cherry-pick <the fix commit>   # or open a second PR into develop
```

**The fix must reach `develop` before the end of the same day.** A hotfix that exists only
on `main` is a regression waiting to ship in the next release. This is the classic failure
mode of two-branch models, and it is why hotfixes require an explicit checklist item in the
[PR template](../../.github/PULL_REQUEST_TEMPLATE.md).

Hotfixes should be **rare**. If you are cutting more than one a month, the problem is not
your branching model — it is your [Definition of Done](05-definition-of-done.md).

## "Is this really trunk-based?"

Honest answer: **it is a pragmatic variant, and the distinction is worth understanding.**

Strict [trunk-based development](https://trunkbaseddevelopment.com/) has exactly one
long-lived branch. It explicitly rejects GitFlow and its long-lived `develop`. By the letter
of that definition, a repo with both `main` and `develop` is not trunk-based.

What makes a model trunk-based in *substance* is not the branch count — it is:

1. **A single integration point** that everyone merges into, frequently. ✅ `develop`.
2. **Short-lived branches.** ✅ Capped at two days.
3. **No parallel long-lived development lines.** ✅ `main` receives no development.
4. **A mainline that is always releasable.** ✅ Enforced by CI gates.

GitFlow's actual sins are `develop` *and* `release/*` *and* `feature/*` *and* `hotfix/*` all
living for weeks, with merges flowing in several directions at once. None of that happens here.
`main` in this model carries no development; it is a tagged record of what shipped.

**The honest trade-off:** you could delete `develop`, release straight from `main`, and be
strictly trunk-based with one fewer moving part. That is the better model once you have
automated deployment and real confidence in your test suite. This repository keeps `develop`
because its purpose is *teaching the full ritual* — including the release gate, which is the
step most people never get to practise. See
[ADR-0001](../adr/0001-trunk-based-development-with-a-release-branch.md) for the full argument
and the conditions under which we would drop `develop`.

## Branch protection (enforced on the server, not by goodwill)

| Rule | `main` | `develop` |
| --- | --- | --- |
| Direct pushes blocked | ✅ | ✅ |
| Pull request required | ✅ | ✅ |
| Status checks must pass | ✅ | ✅ |
| Branch must be up to date before merge | ✅ | ✅ |
| Conversations must be resolved | ✅ | ✅ |
| Force-push blocked | ✅ | ✅ |
| Deletion blocked | ✅ | ✅ |
| Linear history required | ✅ | ✅ |

**On required approvals:** this repository is set to **0 required approvals**, because it is
a solo practice harness and a rule you must bypass daily is worse than no rule. **In a team
setting, set this to 1 (or 2 for high-risk repos)** — it is the single highest-value protection
rule, and it is the one this repo cannot honestly demonstrate. See
[Code Review Standard](04-code-review-standard.md) for what that review should consist of.

## See also

- [Commit Convention](02-commit-convention.md) — the grammar of the commits on these branches
- [Release & Versioning](07-release-and-versioning.md) — how `develop` becomes `main`
- [Workflow Walkthrough](10-workflow-walkthrough.md) — the whole loop, with commands
