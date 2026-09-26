# Configuration

Every environment variable the code reads is listed here. The templates are [`apps/backend/.env.example`](../apps/backend/.env.example), [`apps/backend/.env.test.example`](../apps/backend/.env.test.example) and [`apps/frontend/.env.example`](../apps/frontend/.env.example). All `.env*` files are gitignored.

## Backend (`apps/backend`)

| Variable | Required | Default | Used for |
| --- | --- | --- | --- |
| `DATABASE_URL` | yes | — | Postgres connection string ([`typeorm.config.ts`](../apps/backend/src/db/typeorm.config.ts)). For Supabase in production, use the transaction-mode pooler on port `6543` |
| `JWT_SECRET` | yes | — | Signing and verifying access tokens. The app won't start without it |
| `NODE_ENV` | no | unset | `production` turns on DB SSL (`rejectUnauthorized: false`) and loads migrations from `dist/`. Any other value (`local`, `test`) behaves the same as unset |
| `PORT` | no | `3001` | HTTP port |
| `FRONTEND_URL` | no | unset | The allowed CORS origin. If it's unset, the `cors` package falls back to `*` |
| `ADMIN_EMAIL` | no | — | Together with `ADMIN_PASSWORD`, creates an admin on startup if missing ([auth.md](auth.md#admin-bootstrap)) |
| `ADMIN_PASSWORD` | no | — | See `ADMIN_EMAIL` |
| `ADMIN_NAME` | no | `Admin` | Display name for the admin that gets created |

### Which file gets loaded

| File | Loaded by |
| --- | --- |
| `.env` | `start`, `start:dev`, the migration scripts, `seed:local` (through `@nestjs/config` and `dotenv/config`) |
| `.env.test` | `test:e2e`, `seed:test`, `start:test` (through `node --env-file`) |
| `.env.prod` | `start:prod`, `seed:prod` |

`@nestjs/config` and `dotenv` also read `.env` but never overwrite variables that are already set. So when a script runs with `.env.test` or `.env.prod`, any variable **missing** from that file falls back to its value in `.env`. For example, `ADMIN_EMAIL` from `.env` will create an admin in the test database.

## Frontend (`apps/frontend`)

| Variable | Required | Default | Used for |
| --- | --- | --- | --- |
| `BACKEND_URL` | yes in production | `http://localhost:3001` | The backend base URL for Server Components and `/api/*` route handlers. It's only read on the server and is never exposed to the browser |
| `PLAYWRIGHT_BASE_URL` | no | `http://localhost:3000` | The frontend URL Playwright tests visit |
| `NODE_ENV` | set by Next.js | — | `production` adds `secure` to the auth cookies |

Next.js loads `.env` for `dev`, `build` and `start`. Both Playwright configs also load an optional `apps/frontend/.env.test`. For which `BACKEND_URL` each test suite uses, see [testing.md](testing.md#playwright).

## Adding a variable

Add it to the relevant `.env*.example`, add a row to the table above, and, if production needs it, set it in Vercel or Render ([deployment.md](deployment.md)).
