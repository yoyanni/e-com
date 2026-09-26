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
npm run test:e2e:backend           # needs apps/backend/.env.test (real database, truncated on every test)
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
- [docs/deployment.md](docs/deployment.md): Vercel, Render, Supabase
- [docs/issues.md](docs/issues.md): known bugs and gaps
- [docs/decisions/](docs/decisions/README.md): why things are the way they are

## Rules that break things when missed

- **Frontend:** Middleware lives in `apps/frontend/proxy.ts`.
- **Shared package:** after editing `packages/shared/src`, rebuild it. The apps import the compiled `dist/`.
- **Entities:** after changing an entity, run `npm run migration:generate -w @e-com/backend` and commit the generated `.js` migration. `synchronize` is off, and migrations run automatically when the app starts.
- **Validation pipe:** the global `ValidationPipe` options in `apps/backend/src/main.ts` are copied in `apps/backend/test/test-helpers.ts`. Change both.
- **Client-reachable endpoints:** a new backend endpoint that the browser needs also needs a route handler under `apps/frontend/app/api/`. The browser never calls the backend directly.
- **Protected pages:** a new protected top-level path goes in both `PROTECTED_ROUTES` and `config.matcher` in `proxy.ts`, and the page goes under `app/(protected)/`. Links to it need `prefetch={false}`.
- **Seeds:** never run `seed:prod`, and never point `.env.test` at a database that matters. Both wipe data.
- **Docs:** delete an item from `docs/issues.md` in the same commit that fixes it. Don't edit an accepted decision record. Add a new one and mark the old one as superseded. Add any new doc to `docs/README.md` and to the list above.
