# Security Policy

## Scope

This is a **practice repository** for exercising an SDLC. It has no production deployment, no
authentication, no user data, and stores everything in process memory.

Treat it accordingly: **do not deploy it anywhere public**, and do not put anything real into it.

## Supported versions

Only the latest release on `main` receives fixes.

## Reporting a vulnerability

Open a [private security advisory](https://github.com/victorneves-plank/sdlc-harness-todo/security/advisories/new).
Please do not open a public issue for anything exploitable.

Expect an acknowledgement within a week. There is no bounty.

## Known and accepted limitations

These are deliberate, documented properties of a teaching repository — not oversights:

- **No authentication or authorisation.** Every endpoint is open.
- **In-memory storage.** All data is lost on restart; see [ADR-0003](docs/adr/0003-in-memory-session-storage.md).
- **Permissive CORS in development.** Locked to the dev origin, but not hardened.
- **No rate limiting.** Trivially exhaustible.

If you are adapting any of this for real use, every item above is something you must fix first.

## Dependency security

Dependabot is enabled for npm and GitHub Actions. `npm audit` runs in CI and reports on
high-severity findings without blocking the build — a blocking audit on a practice repo would
mean a red pipeline caused by a transitive dev dependency nobody can act on.
