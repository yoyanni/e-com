# Configuration

Every environment variable the code reads is listed here. The templates are [`apps/backend/.env.example`](../apps/backend/.env.example), [`apps/backend/.env.test.example`](../apps/backend/.env.test.example) and [`apps/frontend/.env.example`](../apps/frontend/.env.example). All `.env*` files are gitignored.

## Backend (`apps/backend`)

| Variable | Required | Default | Used for |
| --- | --- | --- | --- |
| `DATABASE_URL` | yes | — | Postgres connection string ([`typeorm.config.ts`](../apps/backend/src/db/typeorm.config.ts)). The app and every migration script refuse to start without it. SSL is off unless the URL asks for it with `sslmode` (for a hosted database such as Supabase, `?sslmode=no-verify` matches the old `rejectUnauthorized: false`). On the VPS, Compose sets it to `postgresql://ecom:${ECOM_DB_PASSWORD}@postgres:5432/ecom`, with the password from the `.env` next to the Compose file ([deployment.md](deployment.md#container-environment)) |
| `JWT_SECRET` | yes | — | Signing and verifying access tokens. The app won't start without it |
| `NODE_ENV` | no | unset | `production` makes `CORS_ORIGIN` required and loads migrations from `dist/` instead of `src/`. Any other value (`local`, `test`) behaves the same as unset. Compose sets `production` on the VPS |
| `PORT` | no | `3001` | HTTP port. Compose sets `3000` on the VPS, which is where Caddy proxies to |
| `CORS_ORIGIN` | in production | unset | The one allowed CORS origin, with credentials: the exact Vercel URL in production. With `NODE_ENV=production` the app refuses to start without it. Elsewhere, leaving it unset turns CORS off (same-origin only). There's no `*` fallback |
| `ADMIN_EMAIL` | no | — | Together with `ADMIN_PASSWORD`, creates an admin on startup if missing ([auth.md](auth.md#admin-bootstrap)) |
| `ADMIN_PASSWORD` | no | — | See `ADMIN_EMAIL` |
| `ADMIN_NAME` | no | `Admin` | Display name for the admin that gets created |
| `NODE_OPTIONS` | no | — | Read by Node, not the app. Compose sets `--max-old-space-size=192` on the VPS ([deployment.md](deployment.md#runtime-constraints)) |

### Which file gets loaded

| File | Loaded by |
| --- | --- |
| `.env` | `start`, `start:dev`, `migration:generate`, `migration:run`, `migration:revert`, `seed:local` (through `@nestjs/config` and `dotenv/config`) |
| `.env.test` | `test:e2e`, `migration:run:test`, `seed:test`, `start:test` (through `node --env-file`) |
| none | `migration:run:prod` and `seed:prod`, which run inside the container and use its environment |
| `.env.prod` | `start:prod` |

`@nestjs/config` and `dotenv` also read `.env` but never overwrite variables that are already set. So when a script runs with `.env.test` or `.env.prod`, any variable **missing** from that file falls back to its value in `.env`. For example, `ADMIN_EMAIL` from `.env` will create an admin in the test database.

## Frontend (`apps/frontend`)

| Variable | Required | Default | Used for |
| --- | --- | --- | --- |
| `BACKEND_URL` | yes in production | `http://localhost:3001` | The backend base URL for Server Components and `/api/*` route handlers. It's only read on the server and is never exposed to the browser |
| `PLAYWRIGHT_BASE_URL` | no | `http://localhost:3000` | The frontend URL Playwright tests visit |
| `NODE_ENV` | set by Next.js | — | `production` adds `secure` to the auth cookies |

Next.js loads `.env` for `dev`, `build` and `start`. Both Playwright configs also load an optional `apps/frontend/.env.test`. For which `BACKEND_URL` each test suite uses, see [testing.md](testing.md#playwright).

## Adding a variable

Add it to the relevant `.env*.example`, add a row to the table above, and, if production needs it, set it in Vercel or in `env/ecom.env` on the VPS ([deployment.md](deployment.md#container-environment)). Don't set `NODE_ENV`, `PORT`, `NODE_OPTIONS` or `DATABASE_URL` there: the Compose file sets them, and its values win. Never bake a value into the Docker image.
