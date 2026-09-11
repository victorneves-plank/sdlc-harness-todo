<!--
  Title must follow Conventional Commits — it becomes the squash commit on develop.
    <type>(<scope>): <imperative, lowercase, no full stop>
  e.g. feat(web): filter todos by completion status

  Do not delete sections. Write "N/A — <reason>" if one does not apply.
  An empty section reads as "I didn't think about this".
-->

## Why

<!-- What problem does this solve? What happens if we merge nothing?
     If you can't answer in two sentences, this may be YAGNI. -->

Closes #

## What

<!-- What changed, at the level of design — not a restatement of the diff.
     "Extracted the completion rule into the Todo entity so the handler is just plumbing." -->

## How to verify

<!-- Give the reviewer a path to conviction that isn't "read every line and trust me".
     Exact commands, what they should see, which test covers it by name. -->

```bash
npm run verify
```

## Trade-offs and alternatives

<!-- What you considered and rejected, and why. Pre-empts "why didn't you just...?" -->

## Risk

<!-- What could break. What isn't covered by tests. What you're least sure about.
     Naming your own weak spot is the highest-value thing in this description —
     it aims scarce reviewer attention where it actually pays. -->

## Screenshots

<!-- Required for any visible UI change. Before/after if you changed something existing. -->

---

## Definition of Done

<!-- See docs/sdlc/05-definition-of-done.md. All boxes, or explain why not. -->

- [ ] Does what the issue asked, and nothing it didn't ask for
- [ ] Edge cases handled deliberately (empty, missing, boundary, duplicate, concurrent)
- [ ] New behaviour has a test that **fails without this change** (I confirmed it goes red)
- [ ] Bug fixes have a regression test reproducing the original defect
- [ ] `npm run verify` passes locally
- [ ] Follows the [coding standards](../docs/sdlc/08-coding-standards.md); dependency rule holds
- [ ] Docs updated in **this** PR if user-visible behaviour changed
- [ ] ADR added if a significant technical decision was made
- [ ] Under 400 lines changed, or the size is justified above
- [ ] I have **read my own diff** in the GitHub UI
- [ ] Branch is up to date with `develop`

<!-- Hotfixes only — delete this section otherwise -->
### Hotfix

- [ ] This is a hotfix branched from `main`
- [ ] **The fix will reach `develop` the same day** (cherry-pick or second PR) — a hotfix that
      lives only on `main` re-ships as a regression in the next release
