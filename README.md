# E-Commerce Platform

A full-stack e-commerce application built as an npm monorepo. Users can browse and filter products, manage a shopping cart, and place orders. Admin users can create and update products.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TanStack Query v5, Tailwind CSS v4, shadcn/ui |
| Backend | NestJS 11, TypeORM 0.3, PostgreSQL |
| Shared | TypeScript types & constants (`@e-com/shared`) |
| Database | PostgreSQL (Supabase) |
| Frontend Deployment | Vercel (frontend + API proxy) |
| Backend Deployment | Render |

## Features

- **Authentication** — JWT access tokens (15 min) with refresh token rotation (7 days), httpOnly cookies
- **Product browsing** — full-text search, category filter, price range, sort by price or date, pagination
- **Shopping cart** — add/update/remove items with optimistic UI updates
- **Checkout** — cart-to-order conversion with a full order history view

## Repository Structure

```
├── apps/
│   ├── backend/    # NestJS REST API
│   └── frontend/   # Next.js App Router
└── packages/
    └── shared/     # Shared TypeScript interfaces & constants
```

→ [Backend docs](apps/backend/README.md) — API reference, migrations, seeding, testing  
→ [Frontend docs](apps/frontend/README.md) — routing, data fetching, testing

## Quick Start

**Prerequisites:** Node.js 20+, PostgreSQL database

```bash
# Install all workspace dependencies from repo root
npm install
```

Copy and fill in the env files for each app (see their READMEs), then:

```bash
# Start backend  (http://localhost:3001)
npm run dev:backend

# Start frontend (http://localhost:3000)
npm run dev:frontend
```

## Scripts (run from repo root)

| Command | Description |
|---|---|
| `npm run dev:backend` | Start NestJS in watch mode |
| `npm run dev:frontend` | Start Next.js dev server |
| `npm run build` | Build all workspaces |
| `npm run build:vercel` | Vercel-specific build (shared + frontend only) |
| `npm run lint` | ESLint across all workspaces |
| `npm run test` | Run all unit tests (backend + frontend) |
| `npm run test:all` | Run all unit + E2E tests |
| `npm run test:unit` | Run all unit tests (backend + frontend) |
| `npm run test:unit:backend` | Backend unit tests (Jest) |
| `npm run test:unit:frontend` | Frontend unit tests (Jest) |
| `npm run test:backend` | Backend unit + E2E tests |
| `npm run test:frontend` | Frontend unit + E2E tests |
| `npm run test:e2e` | Run all E2E tests (backend + frontend) |
| `npm run test:e2e:backend` | Backend E2E tests |
| `npm run test:e2e:frontend` | Frontend E2E tests (Playwright) |
| `npm run test:e2e:frontend:mock` | Frontend mocked Playwright E2E tests |
| `npm run test:e2e:frontend:smoke` | Frontend smoke Playwright E2E tests |
