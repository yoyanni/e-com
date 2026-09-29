# Deployment

| Part | Host | Config in repo |
| --- | --- | --- |
| Frontend (Next.js) | Vercel | [`vercel.json`](../vercel.json) |
| Backend (NestJS) | Docker container on a shared VPS, behind Caddy | [`Dockerfile`](../Dockerfile), [`.dockerignore`](../.dockerignore), [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) |
| Database | Postgres container in the same Docker Compose stack | none. Compose lives on the server |

Why the backend moved off Render and Supabase: [decision 0007](decisions/0007-backend-in-docker-on-shared-vps.md).

## Frontend on Vercel

`vercel.json` runs `npm ci`, then `npm run build:vercel`, and serves `apps/frontend/.next`. `build:vercel` builds `@e-com/shared` **before** `@e-com/frontend`, because the frontend imports the compiled `dist/` ([decision 0003](decisions/0003-shared-package-compiled-to-commonjs.md)).

Set `BACKEND_URL` in the Vercel project to the backend's public URL, `https://ecom-api.<domain>`. The browser only ever talks to Vercel, and the route handlers call the backend from the server ([architecture.md](architecture.md#request-paths)).

## Backend image

The [`Dockerfile`](../Dockerfile) is at the repo root, because the backend needs the `@e-com/shared` workspace. It has two stages:

1. **build:** installs the backend's and shared package's dependencies, dev ones included, then builds `@e-com/shared` and `@e-com/backend`. `nest build` copies the `.js` migrations into `dist/`.
2. **runtime:** `node:22-alpine` with production dependencies only, plus the two `dist/` folders. It runs as the `node` user from `/app/apps/backend`, so the relative `dist/db/migrations` path in the TypeORM config resolves. `CMD` is `node dist/main.js`.

Every workspace's `package.json` is copied into both stages, the frontend's included, because `npm ci` checks all of them against the lockfile. [`.dockerignore`](../.dockerignore) keeps everything else from the frontend out of the build context, along with `node_modules`, `dist`, `docs` and every `.env*` file.

The image contains no configuration. Everything comes from the environment when the container starts.

To build and run it locally:

```bash
docker build -t ecom-api .
docker run --rm -p 3000:3000 --memory=256m \
  -e NODE_OPTIONS=--max-old-space-size=192 -e PORT=3000 -e NODE_ENV=production \
  -e DATABASE_URL=... -e JWT_SECRET=... -e CORS_ORIGIN=... \
  ecom-api
```

## Backend on the VPS

[`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) deploys the backend on a push to `main` that touches the backend, the shared package, the `Dockerfile`, `.dockerignore`, the root or frontend `package.json`, the lockfile or the workflow itself. It can also be run by hand from the Actions tab. It:

1. Builds the `Dockerfile` for `linux/amd64` and pushes it to `ghcr.io/<github-user>/ecom-api`, tagged `latest` and with the commit SHA. Layers are cached in the GitHub Actions cache.
2. SSHes into the VPS as `deploy`, then runs `docker compose pull ecom-api && docker compose up -d ecom-api && docker image prune -f` in `~/app`.

It doesn't run migrations (see [Migrations](#migrations)), and only one deploy runs at a time.

The repository needs two Actions secrets. The GHCR push uses the built-in `GITHUB_TOKEN`.

| Secret | Value |
| --- | --- |
| `DEPLOY_HOST` | The VPS hostname or IP |
| `DEPLOY_SSH_KEY` | A private ed25519 key whose public key is in `~deploy/.ssh/authorized_keys` on the VPS |

The workflow trusts whatever host key the VPS presents (`ssh-keyscan`), because the VPS is rebuilt with a new key between uses. If the GHCR package is private, the VPS needs `docker login ghcr.io` with a read-only token. To roll back, point the Compose service at an older `ecom-api:<sha>` tag and run `docker compose up -d ecom-api`.

The container runs:

- **Environment:** see [configuration.md](configuration.md#backend-appsbackend) for what each variable does.
  - Compose sets `DATABASE_URL` (pointing at the `postgres` service) and `NODE_OPTIONS`.
  - The server's `env/ecom.env` file sets `PORT=3000`, `NODE_ENV=production`, `JWT_SECRET`, `CORS_ORIGIN` (the exact Vercel URL), and optionally the `ADMIN_*` variables.
  - The app refuses to start without `DATABASE_URL`, `JWT_SECRET`, or (in production) `CORS_ORIGIN`.
- **Memory:** a 256 MB container limit with `NODE_OPTIONS=--max-old-space-size=192`. The box is shared with another API, so avoid in-memory caches and unbounded queries. Paginated endpoints cap `limit` at 100.
- **TLS:** Caddy terminates HTTPS at `https://ecom-api.<domain>` and proxies plain HTTP to the container. The app has no TLS handling of its own, and the connection to the Compose Postgres doesn't use SSL.
- **Disk:** none that survives. The VPS is destroyed and rebuilt between uses, so the app logs to stdout only and must not write files. Anything that needs storage goes to external object storage.
- **Health check:** `GET /health` returns `200 {"status":"ok"}` without touching the database, so Caddy or Compose can poll it cheaply.

### Migrations

**Starting the container never changes the schema** ([decision 0008](decisions/0008-migrations-run-explicitly.md)). After deploying an image that includes a new migration, and on a fresh database, run:

```bash
docker compose run --rm ecom-api npm run migration:run:prod
```

It uses the compiled `dist/db/typeorm.config.js` and the same environment as the service. Until it runs, the app serves against the old schema.

### Seeding

`npm run seed:prod -w @e-com/backend` can't reach the Compose Postgres from a laptop, and the image can't seed either ([O2](issues.md#o2-the-production-image-cant-seed)). The seed **deletes all orders and products** before inserting sample data ([data-model.md](data-model.md#seeding), [O1](issues.md#o1-seedprod-wipes-production-orders-and-products)).
