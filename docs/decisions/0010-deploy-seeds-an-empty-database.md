# 0010. Production data is disposable, and the deploy seeds an empty database

- Status: Accepted
- Date: 2026-10-04

## Context

The VPS is destroyed and rebuilt between uses ([decision 0007](0007-backend-in-docker-on-shared-vps.md)), so production regularly starts with an empty database. The seed couldn't run there: it went through `ts-node` and `@faker-js/faker`, both dev dependencies that aren't in the image, and the Compose Postgres isn't reachable from a laptop. The seed also deletes every order, product and category before inserting, which had been recorded as a high-severity issue.

This is a portfolio project. Nothing in the production database needs to be kept.

## Decision

- Production data is demo data. Losing it is acceptable, so the seed has no production guard and no confirmation.
- `@faker-js/faker` is a runtime dependency, and `seed:prod` runs the compiled `dist/db/seeds/seed.js` with the container's environment.
- The seed takes `--if-empty`, which skips everything when the `products` table has a row.
- [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) runs `npm run seed:prod -- --if-empty` in a one-off container after the migrations ([decision 0009](0009-deploy-workflow-runs-migrations.md)) and before the restart. If it fails, the job fails and the old container keeps serving.
- Running `seed:prod` by hand without the flag resets the demo data.

## Consequences

- A rebuilt VPS has sample data after its first deploy, with no manual step.
- Product IDs and slugs stay the same across deploys, because a non-empty database is never reseeded automatically.
- Anyone with shell access on the VPS can wipe the orders with one command. If the project ever holds data worth keeping, add a guard to the seed and take the step out of the workflow.
- Deleting every product by hand makes the next deploy reseed, which also deletes the orders and categories.
- Faker ships in the image and makes it larger. The seed imports the English-only entry (`@faker-js/faker/locale/en`) to stay inside the container's 192 MB heap.
- Each deploy starts one more short-lived container, with its own database connections.
