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

Because `main` now has the version-bump and CHANGELOG commit that `develop` lacks:

```bash
git checkout develop && git pull
git merge --ff-only main   # succeeds if nothing landed on develop meanwhile
git push
```

If it does not fast-forward, open a normal PR from `main` into `develop`. **Do not skip this
step** — divergence between `main` and `develop` is exactly the failure this model is designed
to avoid, and it starts small and silently.

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
