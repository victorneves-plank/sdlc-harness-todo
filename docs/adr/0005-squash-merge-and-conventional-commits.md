# ADR-0005 — Squash merges with Conventional Commit PR titles

- **Status:** Accepted
- **Date:** 2026-09-11
- **Deciders:** Victor Neves

## Context

GitHub offers three merge strategies, and the choice determines what `develop`'s history looks
like — which in turn determines whether that history is *usable* for anything (bisecting,
reverting, generating a CHANGELOG) or merely a record of keystrokes.

In-branch commits are working notes: "wip", "fix test", "actually fix test", "address review".
They are useful *during* the branch's life and noise afterwards. The question is what survives.

## Options considered

### Option A — Merge commits

Every in-branch commit preserved, plus a merge commit.

**Pros:** Full fidelity. The exact sequence of development is recoverable.

**Cons:** `develop`'s history becomes unreadable — dozens of "wip" commits per feature. Non-linear
topology makes `git bisect` awkward and `git log --oneline` useless. Reverting a feature means
reverting a merge, with all the parent-selection confusion that entails.

### Option B — Rebase merge

In-branch commits replayed linearly onto `develop`.

**Pros:** Linear history, all commits preserved.

**Cons:** Every "wip" commit is now a first-class commit on the mainline, and many of them do
not build — which quietly breaks `git bisect`, the main thing linear history was supposed to
buy. Requires authors to curate their commits with `rebase -i` before every merge, which is a
real skill and an ongoing tax.

### Option C — Squash merge with a Conventional Commit PR title

One commit per PR, message taken from the PR title.

**Pros:** `develop` gets exactly one clean, semantic, buildable commit per reviewed unit of
change. Perfectly linear. Every commit passed CI, so `git bisect` is reliable. Revert is one
`git revert` of one commit. The title grammar makes CHANGELOG and version bumps derivable.
Authors can commit as messily as they like in-branch.

**Cons:** In-branch history is discarded. The PR title becomes load-bearing, so a sloppy title
becomes permanent. Large PRs squash into large commits, so the strategy relies on PRs staying
small.

## Decision

**We choose Option C**, and enforce the title grammar in CI.

The deciding reason: **a history where every commit is buildable, atomic and semantic is a
history you can compute with.** `git bisect` works because every commit passed CI. `git revert`
undoes exactly one feature. The version bump and CHANGELOG are derived rather than decided.
None of that holds under Option A or B.

The cost — losing in-branch history — is acceptable because that history's audience is the
reviewer, who sees it while the PR is open. Its value drops to near zero at merge.

## Consequences

### What this makes easier

- `git log --oneline develop` reads as a changelog already.
- `git bisect` is reliable: every commit on `develop` was green in CI.
- Reverting a feature is one command against one commit.
- SemVer bumps and CHANGELOG sections are derived from commit types, not decided in a meeting.
- Authors are free to commit constantly without curating history.

### What this makes harder

- **In-branch history is gone after merge.** If a PR contained a genuinely important intermediate
  step, that reasoning must be written into the squash commit body or it is lost.
- **The PR title is permanent**, so it must be right. Mitigated by CI validation — but CI can
  check the *grammar*, not whether the description is meaningful. That remains a human
  responsibility.
- **Large PRs become large, unrevertable-in-part commits.** This makes the
  [400-line PR guidance](../sdlc/03-pull-request-guide.md#size-the-rule-everybody-breaks)
  load-bearing rather than advisory: squash merging a 2,000-line PR produces a commit you cannot
  partially revert.
- Attribution for co-authored work needs explicit `Co-Authored-By:` trailers in the squash body.

### What we will need to revisit

- If PR sizes routinely exceed the guidance, squashing stops being an asset and becomes a
  liability. Fix the PR sizes, not the merge strategy.
- If the project ever needs to preserve fine-grained authorship for licensing or compliance
  reasons, reconsider.
