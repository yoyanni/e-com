# 0007. Backend runs as a Docker image on a shared VPS

- Status: Accepted
- Date: 2026-09-27

## Context

The backend ran on Render with a Supabase database. It's one of three portfolio apps, and its API now shares one small VPS with another app's API. The VPS is destroyed and recreated between job searches, so nothing on it can be precious.

## Decision

- The backend ships as a Docker image built from the repo-root [`Dockerfile`](../../Dockerfile) and pushed to GHCR. It runs on a shared 2 GB VPS next to a separate Express + MongoDB API.
- Postgres runs as a container in the same Compose stack, reached at `postgres:5432` on the internal network.
- Caddy is the reverse proxy and terminates TLS.
- The container is capped at 256 MB with a 192 MB V8 heap.
- The image holds no configuration. Compose and `env/ecom.env` on the server provide it at start.

## Consequences

- The app must stay small: no large in-memory caches, and no unbounded queries.
- No local disk persistence. Logs go to stdout, and file storage would need external object storage.
- No TLS in the app, and the Postgres connection doesn't use SSL on the internal network.
- Schema changes need a deliberate step that works after a restore from backup, not an automatic run on every boot.
- The image is built from the whole monorepo context, so the Dockerfile has to know about the workspaces ([decision 0003](0003-shared-package-compiled-to-commonjs.md)).
- Moving back to a managed platform would mean a hosted database with SSL again, and a new record.
