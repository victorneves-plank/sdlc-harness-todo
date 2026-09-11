# ADR-0001 — Trunk-based development with a release branch

- **Status:** Accepted
- **Date:** 2026-09-11
- **Deciders:** Victor Neves

## Context

This repository is a **practice harness for the SDLC**. Its purpose is to exercise a complete,
industry-credible delivery process on a deliberately trivial application.

That purpose creates an unusual constraint: the branching model must be *worth practising*,
which is not the same as being *optimal for a todo app*. For a todo app the optimal model is
"commit to main, deploy on green" — but practising that teaches almost nothing about the
release discipline most teams actually need.

The candidates:

- **GitFlow** is still widely used in industry, and a practitioner will meet it. It is also
  widely agreed — including by its author, Vincent Driessen, in his own 2020 note on the
  original post — to be a poor fit for continuous delivery of web software.
- **Strict trunk-based development** ([trunkbaseddevelopment.com](https://trunkbaseddevelopment.com/))
  has one long-lived branch and explicitly rejects a long-lived `develop`.
- The user requirement for this repository was explicitly *"a main branch and a develop
  branch, with branches created from develop"*.

There is a genuine tension between the last two, and it would be dishonest to paper over it.

## Options considered

### Option A — Strict trunk-based: `main` only

Everyone branches from `main`, short-lived branches, release by tagging `main`.

**Pros:** Fewest moving parts. Strictly what the research endorses. No possibility of
`main`/`develop` divergence. One fewer merge in every cycle.

**Cons:** No release gate to practise — the step where "what is finished" becomes "what is
shipped" simply does not exist as an observable event. Does not match the stated requirement.
Also means the repository would not demonstrate the promotion ritual that most teams with a
QA or approval stage actually need.

### Option B — Full GitFlow

`main`, `develop`, `feature/*`, `release/*`, `hotfix/*`, `support/*`, with merges in several
directions.

**Pros:** Matches a model many organisations still run, so it is recognisable.

**Cons:** Long-lived `release/*` branches encourage exactly the deferred integration this
harness is meant to teach against. Merge topology is genuinely confusing. Actively at odds
with the DORA findings on branch lifetime. Practising it well would mean practising something
we believe to be wrong.

### Option C — Two-branch trunk-based: `develop` is the trunk, `main` is a maturity branch

`develop` is the single integration point. `main` receives no development — only release
promotions from `develop`, each tagged. Working branches are capped at two days.

**Pros:** Preserves every property that makes trunk-based work (single integration point, short
branches, always-healthy mainline, no parallel development lines). Adds exactly one thing: an
explicit, reviewable release gate, which is the ritual worth practising. Satisfies the stated
requirement.

**Cons:** One more branch than strictly necessary. Introduces a real (if small) risk of
`main`/`develop` divergence after a hotfix. A purist would correctly say this is not
trunk-based *by the letter* of the definition.

## Decision

**We choose Option C**, and we name the trade-off rather than hiding it.

The deciding reason: **what makes a model trunk-based is the integration behaviour, not the
branch count.** The failure modes trunk-based development exists to prevent are deferred
integration, long-lived divergent branches, and a mainline that needs stabilising before it
can ship. A `main` that carries no development and receives only tagged promotions causes none
of them.

What Option C adds over Option A is the release promotion — the one step in the SDLC that a
single-branch model gives you no opportunity to practise, and the step most teams get wrong.
For a *harness*, that is worth one extra branch.

## Consequences

### What this makes easier

- There is an explicit, reviewable moment where a release is decided, with a PR and a diff.
- `main` is a readable history of what shipped: one commit per release, each tagged.
- The model maps onto what a practitioner will encounter in most organisations, while avoiding
  GitFlow's actual defects.

### What this makes harder

- **A hotfix can leave `main` and `develop` divergent.** This is the one real risk, and it is
  mitigated procedurally (a required checklist item in the PR template and a same-day rule in
  the [branching strategy](../sdlc/01-branching-strategy.md#4-hotfixes-branch-from-main-and-land-in-both-places))
  rather than mechanically. Procedural mitigations fail eventually; this is the known weak
  point of the model.
- Every release costs one extra PR and one back-merge.
- The model invites cargo-culting. Someone will copy the two branches and skip the two-day cap,
  at which point this is GitFlow with extra steps and none of the benefit. **The cap is the
  load-bearing rule, not the branch layout.**

### What we will need to revisit

Reopen this if any of the following becomes true:

- **Automated deployment from `develop` is added.** The release gate stops being a useful
  ritual and becomes pure friction. Drop `develop`, move to Option A.
- **`main` and `develop` diverge more than once.** The procedural mitigation has failed
  empirically; either automate the back-merge or remove the second branch.
- **More than one person contributes regularly.** Re-evaluate required approvals (currently 0,
  see [branching strategy](../sdlc/01-branching-strategy.md#branch-protection-enforced-on-the-server-not-by-goodwill))
  before anything else.
