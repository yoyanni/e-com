# Backend (NestJS) image. Built from the repo root because the backend depends on
# the @e-com/shared workspace. See docs/deployment.md.

# ── Build: install all deps, compile shared then backend ─────────────────────
FROM node:22-alpine AS build
WORKDIR /app

# Every workspace manifest is copied so npm ci can validate the lockfile.
COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/
COPY packages/shared/package.json packages/shared/
RUN npm ci -w @e-com/backend -w @e-com/shared

COPY packages/shared packages/shared
COPY apps/backend apps/backend
RUN npm run build -w @e-com/shared && npm run build -w @e-com/backend

# ── Runtime: production deps and compiled output only ────────────────────────
FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/
COPY packages/shared/package.json packages/shared/
RUN npm ci --omit=dev -w @e-com/backend -w @e-com/shared && npm cache clean --force

COPY --from=build /app/packages/shared/dist packages/shared/dist
COPY --from=build /app/apps/backend/dist apps/backend/dist

# Relative paths in the TypeORM config (dist/db/migrations) resolve from here.
WORKDIR /app/apps/backend
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
