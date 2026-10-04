# Agent instructions

This is an npm-workspaces monorepo: `apps/backend` (NestJS), `apps/frontend` (Next.js 16), and `packages/shared` (types and constants).

## Commands (from the repo root)

```bash
npm install
npm run build -w @e-com/shared     # required before running, building or type-checking either app
npm run dev:backend                # :3001
npm run dev:frontend               # :3000
npm run lint                       # ESLint in all workspaces (the backend lint auto-fixes)
npm run build                      # also type-checks both apps
npm test                           # unit tests, no database needed
npm run test:e2e:backend           # needs apps/backend/.env.test and `migration:run:test` (real database, truncated on every test)
npm run test:e2e:frontend:mock     # Playwright, no backend needed
```

## Docs

Read the relevant doc before changing that area, and update it in the same change.

- [docs/getting-started.md](docs/getting-started.md): local setup and root scripts
- [docs/architecture.md](docs/architecture.md): workspaces, modules, request paths, shared package
- [docs/api.md](docs/api.md): backend endpoints and Next.js `/api/*` route handlers
- [docs/auth.md](docs/auth.md): tokens, cookies, refresh rotation, guards, route protection
- [docs/data-model.md](docs/data-model.md): entities, migrations, seeding
- [docs/frontend.md](docs/frontend.md): routes, data fetching, caching, hooks, UI
- [docs/configuration.md](docs/configuration.md): every environment variable
- [docs/testing.md](docs/testing.md): unit, e2e and Playwright suites
- [docs/deployment.md](docs/deployment.md): Vercel, the backend Docker image, the VPS
- [docs/issues.md](docs/issues.md): known bugs and gaps
- [docs/decisions/](docs/decisions/README.md): why things are the way they are

## Rules that break things when missed

- **Frontend:** Middleware lives in `apps/frontend/proxy.ts`.
- **Shared package:** after editing `packages/shared/src`, rebuild it. The apps import the compiled `dist/`.
- **Entities:** after changing an entity, run `npm run migration:generate -w @e-com/backend` and commit the generated `.js` migration. `synchronize` is off, and migrations never run on startup: apply them with `migration:run` (local) or `migration:run:test` (e2e DB). In production the deploy workflow runs `migration:run:prod` in the container before restarting the API, while the old image is still serving, so a migration must not break the code that's already running.
- **Validation pipe:** the global `ValidationPipe` options in `apps/backend/src/main.ts` are copied in `apps/backend/test/test-helpers.ts`. Change both.
- **Client-reachable endpoints:** a new backend endpoint that the browser needs also needs a route handler under `apps/frontend/app/api/`. The browser never calls the backend directly.
- **Protected pages:** a new protected top-level path goes in both `PROTECTED_ROUTES` and `config.matcher` in `proxy.ts`, and the page goes under `app/(protected)/`. Links to it need `prefetch={false}`.
- **Seeds:** every seed script wipes orders, products and categories unless it's passed `--if-empty`. Production holds demo data only, so that's accepted for `seed:prod`, but never point `.env.test` at a database that matters.
- **Backend runtime (VPS):** the container has a 256 MB limit and a 192 MB heap, and no disk that survives a rebuild. No unbounded queries or in-memory caches, logs to stdout only, no TLS in the app, and never hard-code or bake in secrets, `DATABASE_URL` or CORS origins. The `Dockerfile` copies every workspace's `package.json`, so a new workspace needs adding there.
- **Docs:** delete an item from `docs/issues.md` in the same commit that fixes it. Don't edit an accepted decision record. Add a new one and mark the old one as superseded. Add any new doc to `docs/README.md` and to the list above.
