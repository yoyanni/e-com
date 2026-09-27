# Getting started

## Prerequisites

- Node.js 20 or later and npm 10 or later (enforced by `engines` in the root [`package.json`](../package.json))
- A PostgreSQL database. A local Postgres works, and so does a hosted one such as Supabase (add `sslmode` to `DATABASE_URL`, see [configuration.md](configuration.md#backend-appsbackend)).

## First-time setup

Run every command from the repo root.

1. **Install** all workspaces:

   ```bash
   npm install
   ```

2. **Build the shared package.** Both apps import `@e-com/shared` from its compiled `dist/`, so they won't start without it. Rebuild it whenever you change [`packages/shared/src`](../packages/shared/src/index.ts).

   ```bash
   npm run build -w @e-com/shared
   ```

3. **Create env files.** See [configuration.md](configuration.md) for what each variable does.

   ```bash
   cp apps/backend/.env.example apps/backend/.env
   cp apps/frontend/.env.example apps/frontend/.env
   ```

4. **Create the schema.** The backend never applies migrations when it starts ([data-model.md](data-model.md#migrations)), so run this now and again whenever a new migration lands.

   ```bash
   npm run migration:run -w @e-com/backend
   ```

5. **Seed sample data** (optional). This **deletes** all existing orders, products and categories first. See [data-model.md](data-model.md#seeding).

   ```bash
   npm run seed:local -w @e-com/backend
   ```

6. **Run both apps** in separate terminals:

   ```bash
   npm run dev:backend    # NestJS in watch mode on http://localhost:3001
   npm run dev:frontend   # Next.js dev server on http://localhost:3000
   ```

To get an admin account, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` before you start the backend ([auth.md](auth.md#admin-bootstrap)). Registering through the UI always creates a customer.

The API can also be called directly with the [Bruno](https://www.usebruno.com/) collection in [`apps/backend/bruno/`](../apps/backend/bruno). Its login request stores `accessToken` and `refreshToken` as Bruno global variables.

## Root scripts

| Command | What it does |
| --- | --- |
| `npm run dev:backend` | Start NestJS in watch mode |
| `npm run dev:frontend` | Start the Next.js dev server |
| `npm run build` | Build shared, backend and frontend |
| `npm run build:vercel` | Build shared and frontend only (used by Vercel) |
| `npm run lint` | Run ESLint in every workspace. The backend lint script runs with `--fix` |
| `npm test` / `npm run test:unit` | Backend and frontend unit tests |
| `npm run test:unit:backend` / `test:unit:frontend` | Unit tests for one app |
| `npm run test:e2e` | Backend e2e, then frontend Playwright (mocked + smoke) |
| `npm run test:e2e:backend` | Backend e2e against the test database |
| `npm run test:e2e:frontend` | Frontend Playwright, mocked then smoke |
| `npm run test:e2e:frontend:mock` / `:smoke` | One Playwright suite |
| `npm run test:backend` / `test:frontend` | Unit and e2e tests for one app |
| `npm run test:all` | Every unit and e2e test |

Each app has more scripts in its own `package.json`, for example migrations and seeds in the backend. Run them with `-w @e-com/backend` or `-w @e-com/frontend`. For what the e2e suites need, see [testing.md](testing.md).
