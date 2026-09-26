# 0005. Two Playwright suites: mocked and smoke

- Status: Accepted
- Date: 2026-06-01

## Context

End-to-end tests against the real backend need a database, seeding and a backend build, so they're slow and depend on data. Mocking only in the browser (`page.route`) isn't enough, because product and category pages are rendered by Server Components that fetch from `BACKEND_URL` on the Next.js server, where the browser can't intercept them.

## Decision

- **Mocked suite** (`playwright.mocked.config.ts`, `e2e/mocked/`): Next.js runs with `BACKEND_URL` pointing at a small Node HTTP mock server (`e2e/mock-server/server.mjs`) that serves the Server Component reads. Browser calls to `/api/*` are stubbed in each test with `page.route`.
- **Smoke suite** (`playwright.config.ts`, `e2e/smoke/`): runs against the real backend, seeded from `.env.test`, covering the most important journeys (auth, checkout). This was added the next day, on 2026-06-02.

## Consequences

- The mocked suite is fast, predictable and needs no database. It can drift from the real API, because its fixtures are maintained by hand.
- The smoke suite catches problems in how the pieces fit together, but it needs a test database and rebuilds the backend.
- Both suites use port `:3002` for their backend, so they can't run at the same time (see [issue T1](../issues.md#t1-playwright-suites-can-reuse-the-wrong-server)).
