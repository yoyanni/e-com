# 0004. Schema comes only from migrations, applied on app startup

- Status: Superseded by [0008](0008-migrations-run-explicitly.md)
- Date: 2026-05-04

## Context

TypeORM's `synchronize` changes the database schema to match the entities on every boot. That's convenient in development but can silently drop columns in production. The app, the TypeORM CLI and the seed script also each needed a connection configuration.

## Decision

- One `DataSource` in `src/db/typeorm.config.ts` is used by the app, the migration CLI and the seed.
- `synchronize: false`. The schema changes only through migration files in `src/db/migrations/`.
- `migrationsRun: true`, so pending migrations run when the app starts, in every environment including e2e tests.
- Migrations are plain `.js` files, which `nest-cli.json` copies into `dist/` so the production build can load them.

## Consequences

- Deploys don't need a separate migration step, and test databases set themselves up.
- A migration that fails stops the app from booting, and a bad migration reaches production as soon as it's deployed. There's no gate to review it first.
- Every entity change needs `migration:generate`. If you forget, the app starts but the entities and the schema no longer match.
