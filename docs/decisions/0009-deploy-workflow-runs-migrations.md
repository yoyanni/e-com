# 0009. The deploy workflow runs migrations before restarting the API

- Status: Accepted
- Date: 2026-10-03
- Supersedes: [0008](0008-migrations-run-explicitly.md)

## Context

[Decision 0008](0008-migrations-run-explicitly.md) stopped migrations running on app startup and left production to a manual command on the VPS after each deploy. Until someone ran it, the new image served against the old schema, and forgetting it was easy. 0008 already named a CI step as the way out.

## Decision

- Everything in 0008 about the app still holds: one `DataSource` in `src/db/typeorm.config.ts`, `synchronize: false`, no `migrationsRun`, migrations as plain `.js` files copied into `dist/`, and one script per environment (`migration:run`, `migration:run:test`, `migration:run:prod`). Starting the app never changes the schema.
- [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) runs `docker compose run --rm -T ecom-api npm run migration:run:prod` on the VPS after pulling the new image and before `docker compose up`. If it fails, the job fails and the old container keeps serving.
- The same command can still be run by hand on the VPS, for example after a restore from backup.

## Consequences

- A migration is applied as soon as it reaches `main`. The pull request is the only place to review it.
- The previous image serves against the new schema between the migration and the restart, and for as long as it takes to fix things if the new container fails its health check. Migrations have to work with the code that's already running: add first, and drop or rename in a later deploy.
- Rolling back to an older image doesn't roll back the schema. There is no `migration:revert` script for production.
- A restart, a rebuild or a restore of the VPS still never touches the schema. Only a deploy or the manual command does.
- The migration container runs next to the live one for a few seconds, with its own 256 MB limit and its own database connections.
- Development and the e2e database are unchanged: `migration:run` and `migration:run:test` are still run by hand.
