# 11 — Delivery Metrics

> **Status:** Informational. Nothing here gates a merge.
> **Source:** [DORA](https://dora.dev/) — *Accelerate*, Forsgren, Humble & Kim.

## The four keys

Years of DORA research converge on four measures that together predict both delivery
performance and organisational outcomes. Two measure **speed**, two measure **stability** —
and the central, counter-intuitive finding is that **they rise and fall together**. Teams that
deploy more often also break things less often. The speed/stability trade-off that most
organisations believe in is not real; it is an artefact of large batches.

| Metric | What it measures | Elite |
| --- | --- | --- |
| **Deployment frequency** | How often you release | On demand, multiple per day |
| **Lead time for changes** | Commit → running in production | Under one hour |
| **Change failure rate** | % of releases causing a failure | 0–15% |
| **Failed deployment recovery time** | How fast you recover | Under one hour |

## How this repository's process targets them

Every rule in this harness exists to move one of these numbers. If a rule here cannot be
traced to one, it should be deleted.

| Practice | Metric it serves | Mechanism |
| --- | --- | --- |
| [Two-day branch cap](01-branching-strategy.md#1-branch-lifetime-is-capped-at-two-days) | Lead time | Work cannot sit unintegrated |
| Small PRs (< 400 lines) | Lead time, change failure rate | Faster review; defects are actually found |
| [One-day review SLA](04-code-review-standard.md#speed) | Lead time | Queueing is usually the largest component |
| CI gates on every PR | Change failure rate | Broken code never reaches the mainline |
| [Definition of Done](05-definition-of-done.md) | Change failure rate | Incomplete work cannot enter `develop` |
| Release-ready mainline | Deployment frequency | Releasing is promotion, not stabilisation |
| Regression test required for every fix | Change failure rate | Bugs cannot silently return |
| Squash merge + Conventional Commits | Recovery time | `git revert` of one clean commit undoes one whole change |
| Small, frequent releases | Recovery time | Less change to search when something breaks |

That last row is the one worth dwelling on. **A small release is a fast diagnosis.** When a
release contains one change, the cause of a failure is known immediately. When it contains
forty, finding it is an investigation. This is why batching features into a "big release"
feels safer and is in fact the opposite.

## Reading them honestly

Metrics measure a **system**, not people. The moment any of these is used to evaluate an
individual, it stops measuring anything real — deployment frequency becomes trivially gameable
by splitting deploys, change failure rate by redefining "failure".

Read them **together**. Any one alone is misleading:

- Deployment frequency up, change failure rate up → you are shipping faster by shipping worse.
- Lead time down, recovery time up → you have optimised the happy path and neglected failure.
- All four flat while everyone is busy → the bottleneck is somewhere you are not looking,
  usually review latency or a manual approval step.

## What you can actually observe here

This is a practice repository with no production deployment, so two of the four are
unmeasurable. Honest proxies:

```bash
# Branch lifetime — the leading indicator for lead time
gh pr list --state merged --limit 30 \
  --json number,title,createdAt,mergedAt \
  --jq '.[] | "\(.number)\t\((((.mergedAt|fromdate) - (.createdAt|fromdate))/3600)|floor)h\t\(.title)"'

# PR size distribution
gh pr list --state merged --limit 30 --json number,additions,deletions \
  --jq '.[] | "\(.number)\t+\(.additions)/-\(.deletions)"'

# Release frequency
git tag --sort=-creatordate --format='%(creatordate:short)  %(refname:short)'
```

If PRs are routinely over 400 lines or living longer than two days, the process is drifting —
and it will drift silently, because nothing will fail. That is exactly why it is worth
measuring.

## See also

- [Branching Strategy](01-branching-strategy.md)
- [Pull Request Guide](03-pull-request-guide.md)
