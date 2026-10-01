# Deployment

| Part | Host | Config in repo |
| --- | --- | --- |
| Frontend (Next.js) | Vercel | [`vercel.json`](../vercel.json) |
| Backend (NestJS) | Docker container on a shared VPS, behind Caddy | [`Dockerfile`](../Dockerfile), [`.dockerignore`](../.dockerignore), [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) |
| Database | Postgres 16 container in the same Docker Compose stack | none. Compose and the Caddyfile live on the server |

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

### The server

The VPS runs a Docker Compose project called `portfolio`, shared with another portfolio app's API (`versus-api`) and its MongoDB. The Compose file and the `Caddyfile` live on the server, not in this repo. Run `docker compose` commands from the directory that holds them. The VPS is destroyed and recreated between uses ([decision 0007](decisions/0007-backend-in-docker-on-shared-vps.md)), so nothing on it can be precious.

The parts of the stack that matter to this app:

| Service | Image | Memory limit | Notes |
| --- | --- | --- | --- |
| `caddy` | `caddy:2` | 96 MB | The only service that publishes ports (80 and 443, TCP and UDP). Networks: `web` |
| `ecom-api` | `ghcr.io/yoyanni/ecom-api:latest` | 256 MB | `restart: unless-stopped`. Starts only after `postgres` passes its health check. Networks: `web`, `db` |
| `postgres` | `postgres:16` | 384 MB | `shared_buffers=128MB`, `max_connections=30`. Data in the `pgdata` volume. Networks: `db` |

The `db` network is `internal`, so Postgres has no route to or from the outside world and no published port. Only `ecom-api` and `docker compose exec` reach it.

### Container environment

See [configuration.md](configuration.md#backend-appsbackend) for what each variable does. Compose sets two groups:

- **In `docker-compose.yml` (`environment:`):** `NODE_ENV=production`, `PORT=3000`, `NODE_OPTIONS=--max-old-space-size=192`, and `DATABASE_URL=postgresql://ecom:${ECOM_DB_PASSWORD}@postgres:5432/ecom`. `ECOM_DB_PASSWORD` comes from the `.env` file next to the Compose file. These win over anything in the env file, so setting them in `env/ecom.env` has no effect.
- **In `env/ecom.env` (`env_file:`):** `JWT_SECRET`, `CORS_ORIGIN` (the exact Vercel URL), and optionally the `ADMIN_*` variables.

The app refuses to start without `DATABASE_URL`, `JWT_SECRET`, or (in production) `CORS_ORIGIN`.

### Runtime constraints

- **Memory:** a 256 MB container limit with a 192 MB V8 heap. The box is shared with another API, so avoid in-memory caches and unbounded queries. Paginated endpoints cap `limit` at 100.
- **TLS:** Caddy serves `ecom-api.<domain>` over HTTPS and proxies plain HTTP to `ecom-api:3000`. It also compresses responses (zstd, gzip), adds `Strict-Transport-Security` and `X-Content-Type-Options: nosniff`, and strips the `Server` header, so the app doesn't need to do any of that. The app has no TLS handling of its own, and the connection to Postgres doesn't use SSL.
- **Client IPs:** every request reaches the app from Caddy, and the client's address is only in `X-Forwarded-For`. Express doesn't trust that header by default, so anything that keys on the IP (such as rate limiting) sees Caddy's address.
- **Disk:** none that survives. The VPS is destroyed and rebuilt between uses, so the app logs to stdout only and must not write files. Anything that needs storage goes to external object storage.
- **Health check:** `GET /health` returns `200 {"status":"ok"}` without touching the database. Nothing polls it yet: the `ecom-api` service has no Compose `healthcheck`, and Caddy doesn't health-check its upstream. The image is Alpine, so a Compose check could use `wget -qO- http://127.0.0.1:3000/health`.
- **Stopping:** the container runs `node` as PID 1 and the app doesn't handle `SIGTERM`, so every restart waits out Docker's 10-second grace period ([O3](issues.md#o3-the-container-ignores-sigterm)).

### Database

`DATABASE_URL` expects a role and a database both named `ecom`, and migrations need that role to be allowed to create tables. Compose mounts `./initdb/postgres` as Postgres's init directory and passes it `ECOM_DB_PASSWORD`. Postgres only runs init scripts on the first start with an empty `pgdata` volume, so on an existing volume a missing role or database has to be created by hand.

Postgres allows 30 connections in total. The app uses TypeORM's default pool of up to 10, and a `migration:run:prod` container opens its own, so keep any pool change well under the limit.

To open a SQL shell:

```bash
docker compose exec postgres psql -U postgres -d ecom
```

### Deploying

[`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) deploys the backend on a push to `main` that touches the backend, the shared package, the `Dockerfile`, `.dockerignore`, the root or frontend `package.json`, the lockfile or the workflow itself. It can also be run by hand from the Actions tab. It:

1. Builds the `Dockerfile` for `linux/amd64` and pushes it to `ghcr.io/<github-user>/ecom-api`, tagged `latest` and with the commit SHA. Layers are cached in the GitHub Actions cache.
2. SSHes into the VPS as `deploy`, then runs `docker compose pull ecom-api && docker compose up -d ecom-api && docker image prune -f` in `~/app`.

It doesn't run migrations (see [Migrations](#migrations)), and only one deploy runs at a time. The service name `ecom-api` and the image name must match the Compose file.

The repository needs two Actions secrets. The GHCR push uses the built-in `GITHUB_TOKEN`.

| Secret | Value |
| --- | --- |
| `DEPLOY_HOST` | The VPS hostname or IP |
| `DEPLOY_SSH_KEY` | A private ed25519 key whose public key is in `~deploy/.ssh/authorized_keys` on the VPS |

The workflow trusts whatever host key the VPS presents (`ssh-keyscan`), because the VPS is rebuilt with a new key between uses. If the GHCR package is private, the VPS needs `docker login ghcr.io` with a read-only token. To roll back, point the Compose service at an older `ecom-api:<sha>` tag and run `docker compose up -d ecom-api`.

### Migrations

**Starting the container never changes the schema** ([decision 0008](decisions/0008-migrations-run-explicitly.md)). After deploying an image that includes a new migration, and on a fresh database, run from the Compose directory:

```bash
docker compose run --rm ecom-api npm run migration:run:prod
```

It uses the compiled `dist/db/typeorm.config.js` and the same environment as the service. Until it runs, the app serves against the old schema.

### Seeding

`npm run seed:prod -w @e-com/backend` can't reach the Compose Postgres from a laptop, and the image can't seed either ([O2](issues.md#o2-the-production-image-cant-seed)). The seed **deletes all orders and products** before inserting sample data ([data-model.md](data-model.md#seeding), [O1](issues.md#o1-seedprod-wipes-production-orders-and-products)).
