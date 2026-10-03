# 0008. Migrations run by an explicit command, not on startup

- Status: Superseded by [0009](0009-deploy-workflow-runs-migrations.md)
- Date: 2026-09-27
- Supersedes: [0004](0004-schema-via-migrations-run-on-startup.md)

## Context

[Decision 0004](0004-schema-via-migrations-run-on-startup.md) applied pending migrations every time the app started. The backend now runs as a container on a shared VPS that is rebuilt and restored from backup ([decision 0007](0007-backend-in-docker-on-shared-vps.md)). A migration firing on every container start is hard to reason about after a restore, and a failing one takes the API down on a box shared with another app. The production image also has no `ts-node` or `src/`, so the existing `migration:run` script couldn't run there.

## Decision

- Keep one `DataSource` in `src/db/typeorm.config.ts`, with `synchronize: false` and migrations as plain `.js` files copied into `dist/`.
- Remove `migrationsRun`. Starting the app never changes the schema.
- Apply migrations with a script per environment:
  - `migration:run` for `.env` (development), through `ts-node`
  - `migration:run:test` for `.env.test`, through `ts-node`
  - `migration:run:prod` inside the production image, through the `typeorm` CLI and the compiled `dist/db/typeorm.config.js`. On the VPS: `docker compose run --rm ecom-api npm run migration:run:prod`.

## Consequences

- Every deploy that includes a migration needs the manual step, and the app will serve against the old schema until it runs.
- A fresh test database has to be migrated once before the e2e suite passes.
- A bad migration no longer stops the app from booting, and it can be reviewed before it's applied.
- A CI step could run `migration:run:prod` before `docker compose up`, if the manual step becomes a chore.
