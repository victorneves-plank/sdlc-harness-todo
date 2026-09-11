# 07 — Release & Versioning

> **Status:** Binding.
> **Scheme:** [Semantic Versioning 2.0.0](https://semver.org/)

## Versioning

```
MAJOR . MINOR . PATCH
  │       │       └── backwards-compatible bug fixes
  │       └────────── backwards-compatible new functionality
  └────────────────── incompatible API changes
```

The version is derived from the [commit types](02-commit-convention.md) that landed on
`develop` since the last tag:

| Commits since last release | Bump |
| --- | --- |
| Any `BREAKING CHANGE:` or `!` | **MAJOR** |
| Any `feat:` (and no breaking change) | **MINOR** |
| Only `fix:` / `perf:` | **PATCH** |
| Only `docs:` / `chore:` / `refactor:` / `test:` / `ci:` / `style:` | No release |

This is exactly why the commit convention is enforced. **The version number is a
consequence of the history, not a decision someone makes in a meeting.** Get the types
right and the version computes itself.

### Pre-1.0

This project is at `0.x.y`. Under SemVer, anything may change at any time before `1.0.0`,
and the public API is not considered stable. We still bump minor for features and patch for
fixes, because the discipline is the point and because switching conventions at 1.0 is how
you get a release where everything breaks silently.

`1.0.0` means one thing: **we are now committing to backwards compatibility**. Do not tag it
casually.

## The release process

A release is the promotion of `develop`'s current state to `main`. Nothing is written,
built differently, or cherry-picked. If `develop` is healthy, it is releasable — that is the
entire premise of the branching model.

### 1. Confirm `develop` is releasable

```bash
git checkout develop && git pull
npm run verify
```

CI green on the tip of `develop`, no open blocking issues tagged for this release.

### 2. Cut the release branch

```bash
git checkout -b release/0.2.0
```

The release branch is **short-lived and thin**. It exists to carry the version bump and
CHANGELOG entry, and to give the release a reviewable PR. It is not a stabilisation branch —
if you find yourself fixing bugs on it, `develop` was not healthy and the real problem is
upstream in your [Definition of Done](05-definition-of-done.md).

### 3. Bump the version and write the CHANGELOG

```bash
npm version 0.2.0 --workspaces --no-git-tag-version --include-workspace-root
```

Then update `CHANGELOG.md` by hand or from the commit log:

```bash
git log v0.1.0..HEAD --pretty=format:'- %s (%h)' --no-merges
```

The CHANGELOG is written **for humans, not for machines**. Translate:

| Commit | CHANGELOG entry |
| --- | --- |
| `feat(web): add completion filter tabs` | Filter todos by all / active / completed |
| `fix(api): return 404 for unknown todo id` | Requesting a todo that does not exist now returns a proper 404 instead of a server error |

Group under **Added / Changed / Fixed / Removed / Deprecated / Security**
([Keep a Changelog](https://keepachangelog.com/en/1.1.0/)). Put **Breaking Changes** first,
with migration instructions, because that is the only section some readers will read.

```
chore(release): 0.2.0
```

### 4. Open the release PR into `main`

Title: `chore(release): 0.2.0`. Body: the CHANGELOG section for this version verbatim, so the
merged PR is a permanent, readable record of what shipped.

### 5. Merge and tag

On merge, tag the merge commit on `main`:

```bash
git checkout main && git pull
git tag -a v0.2.0 -m "Release 0.2.0"
git push origin v0.2.0
gh release create v0.2.0 --title "v0.2.0" --notes-file <(sed -n '/## \[0.2.0\]/,/## \[0.1/p' CHANGELOG.md)
```

Tags are `v`-prefixed (`v0.2.0`); package versions are not (`0.2.0`). This is the near-universal
convention and tooling assumes it.

### 6. Bring the release commit back to `develop`

`main` now has the version-bump and CHANGELOG commit that `develop` lacks. Bring it back by
**cherry-picking the original release commit** — the one from the `release/*` branch, not the
squash commit on `main`:

```bash
git checkout develop && git pull
git checkout -b chore/sync-release-0.2.0
git cherry-pick <sha of the "chore(release): 0.2.0" commit from the release branch>
gh pr create --base develop --title "chore(release): sync 0.2.0 back to develop"
```

**Do not skip this step** — divergence between `main` and `develop` is exactly the failure this
model is designed to avoid, and it starts small and silently.

> #### Why not `git merge --ff-only main`?
>
> Because it cannot work here, and it fails in a way that looks like something else.
>
> `main` only ever receives **squash** commits (ADR-0005), so no commit on `main` is an ancestor
> of `develop`. The merge base of the two branches is permanently the repository's first commit.
> Merging `main` into `develop` therefore reports **every file added since then as an add/add
> conflict** — six conflicts, on the 0.1.0 release, for a change containing no new content.
>
> It gets worse. A conflicting PR cannot have its merge commit computed, so **GitHub runs no
> PR-triggered checks on it at all**. The branch-protection checks do not fail; they silently
> never run, and the PR shows whatever status the last push to the base branch produced. A
> required check that quietly does not run is worse than one that fails.
>
> This was found on the first release of this repository, not in theory. See issue #19 for the
> decision on whether to automate this step or drop `develop` entirely.

## Hotfix releases

For a defect in released code that cannot wait:

1. Branch from `main`: `hotfix/0.2.1-<short-description>`
2. Fix, with a regression test.
3. Bump PATCH, add the CHANGELOG entry.
4. PR into `main`, merge, tag `v0.2.1`.
5. **Same day:** get the fix onto `develop`, by cherry-pick or a second PR.

Step 5 is the one that gets forgotten, and forgetting it means the next release re-ships the
bug you just fixed. The [PR template](../../.github/PULL_REQUEST_TEMPLATE.md) has an explicit
checkbox for it.

## Release cadence

Release when there is something worth releasing. Do not batch features to make a release feel
substantial — **large releases are risky releases**, because the amount of change you have to
reason about when something goes wrong scales with the batch size, and so does the time to
find which change caused it.

The DORA research is unambiguous here: small, frequent releases correlate with *lower* change
failure rates, not higher. Frequency is a safety property. See
[Delivery Metrics](11-metrics-and-dora.md).

## See also

- [Branching Strategy](01-branching-strategy.md) — how `main` relates to `develop`
- [Commit Convention](02-commit-convention.md) — where the version number comes from
