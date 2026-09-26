# Deployment

| Part | Host | Config in repo |
| --- | --- | --- |
| Frontend (Next.js) | Vercel | [`vercel.json`](../vercel.json) |
| Backend (NestJS) | Render | none. The build and start commands are set in the Render dashboard |
| Database | Supabase Postgres | none |

## Frontend on Vercel

`vercel.json` runs `npm ci`, then `npm run build:vercel`, and serves `apps/frontend/.next`. `build:vercel` builds `@e-com/shared` **before** `@e-com/frontend`, because the frontend imports the compiled `dist/` ([decision 0003](decisions/0003-shared-package-compiled-to-commonjs.md)).

Set `BACKEND_URL` in the Vercel project to the public Render URL. The browser only ever talks to Vercel, and the route handlers call Render from the server ([architecture.md](architecture.md#request-paths)).

## Backend on Render

Render deploys from git. The service needs:

- **Build:** build `@e-com/shared`, then `@e-com/backend`. `nest build` copies the `.js` migrations into `dist/`.
- **Start:** run `dist/main` with the environment variables set in the dashboard, for example `node dist/main`. `start:prod` loads `.env.prod` with `node --env-file`, and Node exits if that file doesn't exist.
- **Environment:** `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, `FRONTEND_URL`, and optionally the `ADMIN_*` variables. See [configuration.md](configuration.md#backend-appsbackend).

`NODE_ENV=production` is what turns on SSL for the database connection and makes TypeORM load migrations from `dist/db/migrations`.

**Migrations run automatically every time the backend starts** (`migrationsRun: true`), so a deploy applies any new migrations before the app starts serving. There's no separate migration step to run or skip ([decision 0004](decisions/0004-schema-via-migrations-run-on-startup.md)).

## Database on Supabase

Use Supabase's transaction-mode pooler connection string for `DATABASE_URL` ([configuration.md](configuration.md#backend-appsbackend)).

`npm run seed:prod -w @e-com/backend` runs the seed against the database in `apps/backend/.env.prod`. It **deletes all orders and products** before inserting sample data ([data-model.md](data-model.md#seeding), [issue O1](issues.md#o1-seedprod-wipes-production-orders-and-products)).
