# Testing

The root commands that run several suites together are listed in [getting-started.md](getting-started.md#root-scripts). The commands below run from the repo root with `-w @e-com/backend` or `-w @e-com/frontend`. You can also run them without `-w` from inside the app folder.

## Backend

| Suite | Location | Command | Needs |
| --- | --- | --- | --- |
| Unit | `src/**/*.spec.ts` (auth, cart, orders, products services) | `test`, `test:watch`, `test:coverage` | Nothing. Repositories are hand-written mocks |
| E2E | [`apps/backend/test/*.e2e-spec.ts`](../apps/backend/test) (auth, cart, categories, orders, products) | `test:e2e` | A **real Postgres** set up in `apps/backend/.env.test` |

About the e2e suite:

- It loads `.env.test` with `node --env-file` and runs in band.
- It boots the whole `AppModule` through `createApp()` in [`test/test-helpers.ts`](../apps/backend/test/test-helpers.ts), so pending migrations run automatically.
- **Every test truncates every table** in that database. Never point `.env.test` at a database whose data you want to keep.
- `createApp()` sets up its own copy of the global `ValidationPipe`. If you change the pipe in `main.ts`, change it here too.
- The helpers `registerAndLogin`, `loginAsAdmin`, `seedCategory` and `seedProduct` cover most setup.

To set up the test database, create an empty Postgres database and then copy the template: `cp apps/backend/.env.test.example apps/backend/.env.test`. The template uses `PORT=3002`, which the frontend smoke suite relies on.

## Frontend unit tests (Jest + Testing Library)

- These tests live **only** in [`apps/frontend/__tests__/`](../apps/frontend/__tests__), split into `components/`, `hooks/` and `lib/`. `testMatch` doesn't pick up spec files placed next to source files.
- Shared helpers are in `__tests__/test-utils.tsx` (`renderWithQuery`, `createWrapper` for hooks) and `__tests__/fixtures/mock-data.ts`.
- Commands: `test`, `test:watch`, `test:coverage`.

## Playwright

There are two suites with separate configs ([decision 0005](decisions/0005-two-playwright-suites.md)). Both run Chrome only, write an HTML report to `playwright-report/`, and record traces on the first retry.

| | Mocked | Smoke |
| --- | --- | --- |
| Config | [`playwright.mocked.config.ts`](../apps/frontend/playwright.mocked.config.ts) | [`playwright.config.ts`](../apps/frontend/playwright.config.ts) |
| Tests | `e2e/mocked/*.spec.ts` | `e2e/smoke/*.smoke.ts` |
| Command | `test:e2e:mock` | `test:e2e:smoke` |
| Backend | [`e2e/mock-server/server.mjs`](../apps/frontend/e2e/mock-server/server.mjs) on `:3002`, which serves `/categories` and `/products` fixtures for Server Components | The real backend on `:3002`. Before starting it, the suite runs `seed:test`, then `build`, then `start:test` |
| Browser `/api/*` calls | Stubbed per test with `page.route` (`mockGetCart`, `mockRoute`, `authenticatedPage` in [`e2e/fixtures/auth.ts`](../apps/frontend/e2e/fixtures/auth.ts)) | Real |
| Needs | Nothing | `apps/backend/.env.test` pointing at a test database (it gets reseeded) |

- Both suites run `npm run build && npm start` for the frontend on `:3000`.
- Both use `reuseExistingServer: true`. If something is already listening on `:3000` or `:3002`, the suite uses it as-is ([issue T1](issues.md#t1-playwright-suites-can-reuse-the-wrong-server)).
- Page objects are in `e2e/pages/` (`LoginPage`, `CartPage`, `CheckoutPage`). Tests select elements by role, label and `data-testid`.

To step through a test in the Playwright inspector:

```bash
cd apps/frontend
npx playwright test --config=playwright.mocked.config.ts --debug
```
