# E-Com — Project Overview

A full-stack e-commerce monorepo. Users can browse products, manage a cart, check out, and view order history. Admins can create and update products.

---

## Table of Contents

1. [Monorepo Structure](#monorepo-structure)
2. [Tech Stack](#tech-stack)
3. [Database Schema](#database-schema)
4. [Backend API](#backend-api)
5. [Auth Flow](#auth-flow)
6. [Frontend Routes](#frontend-routes)
7. [Frontend Data Layer](#frontend-data-layer)
8. [Shared Package](#shared-package)
9. [Testing](#testing)
10. [Environment Variables](#environment-variables)
11. [Deployment](#deployment)

---

## Monorepo Structure

NPM workspaces. Three packages:

```
e-com/
├── apps/
│   ├── backend/          # NestJS REST API
│   └── frontend/         # Next.js App Router
├── packages/
│   └── shared/           # TypeScript types & constants
└── package.json          # Workspace root — orchestrates scripts
```

**Backend source:**
```
apps/backend/src/
├── auth/                 # JWT strategy, refresh tokens, guards
├── cart/                 # Cart CRUD
├── categories/           # Category listing
├── db/                   # TypeORM config, migrations, seeds
├── entities/             # TypeORM entity definitions
├── logger/               # Request logging interceptor
├── orders/               # Checkout and order history
├── products/             # Product CRUD, search, filtering
├── utils/                # Slugify helper
├── app.module.ts
└── main.ts               # Bootstrap — CORS, validation pipe, port
```

**Frontend source:**
```
apps/frontend/
├── app/                  # Next.js App Router pages
│   ├── page.tsx          # Home
│   ├── products/         # Listing + detail pages
│   ├── (guest)/          # Login, register (unauthenticated only)
│   └── (protected)/      # Cart, checkout, orders (JWT required)
├── api/                  # Data fetching layer
│   ├── server.ts         # RSC fetch helpers (cached)
│   ├── service.ts        # Axios service functions
│   └── client.ts         # Axios instance + JWT refresh interceptor
├── components/           # UI and feature components
├── hooks/                # TanStack Query hooks
├── lib/                  # cn(), getApiErrorMessage()
├── __tests__/            # Jest unit tests
└── e2e/                  # Playwright tests
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | Next.js 16, React 19, App Router |
| Styling | Tailwind CSS v4, shadcn/ui, Radix UI |
| Client state / fetching | TanStack Query v5, Axios |
| Backend framework | NestJS 11 |
| ORM / Database | TypeORM 0.3, PostgreSQL (Supabase) |
| Auth | JWT (`@nestjs/jwt` + `passport-jwt`) |
| Shared types | `@e-com/shared` (local package) |
| Frontend testing | Jest (unit), Playwright (E2E) |
| Backend testing | Jest (unit + E2E) |
| Frontend hosting | Vercel |
| Backend hosting | Render |

---

## Database Schema

### User
| Field | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `email` | string | unique |
| `passwordHash` | string | bcrypt |
| `name` | string | |
| `role` | enum | `CUSTOMER` \| `ADMIN` |
| `createdAt` / `updatedAt` | timestamp | |

Relations: 1-to-many → Orders, CartItems

### Product
| Field | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `name` | string | |
| `slug` | string | unique |
| `description` | string | nullable |
| `price` | decimal | |
| `stock` | int | |
| `imageUrl` | string | nullable |
| `categoryId` | uuid | FK → Category, nullable |
| `createdAt` / `updatedAt` | timestamp | |

Relations: many-to-one → Category; 1-to-many → CartItems, OrderItems

### Category
| Field | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `name` | string | unique |
| `slug` | string | unique |

Relations: 1-to-many → Products

### CartItem
| Field | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `userId` | uuid | FK → User |
| `productId` | uuid | FK → Product |
| `quantity` | int | |

### Order
| Field | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `userId` | uuid | FK → User |
| `status` | enum | `PENDING` \| `PAID` \| `SHIPPED` \| `DELIVERED` \| `CANCELLED` |
| `total` | decimal | |
| `createdAt` / `updatedAt` | timestamp | |

Relations: many-to-one → User; 1-to-many → OrderItems (cascade delete)

### OrderItem
| Field | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `orderId` | uuid | FK → Order (cascade) |
| `productId` | uuid | FK → Product (restrict) |
| `quantity` | int | |
| `unitPrice` | decimal | snapshot at time of order |

### RefreshToken
| Field | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `tokenHash` | string | indexed |
| `family` | uuid | groups tokens for compromise detection |
| `userId` | uuid | FK → User (cascade) |
| `expiresAt` | timestamp | |
| `revokedAt` | timestamp | nullable — null means active |

---

## Backend API

Base URL: `http://localhost:3001` (dev)

### Auth — `POST/GET /auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | — | Create account, returns token pair |
| `POST` | `/auth/login` | — | Login, returns token pair |
| `POST` | `/auth/refresh` | — | Body: `{ refreshToken }` → new token pair |
| `POST` | `/auth/logout` | — | Body: `{ refreshToken }` → revokes token |
| `GET` | `/auth/me` | JWT | Returns current user |
| `PATCH` | `/auth/users/:id/role` | JWT + ADMIN | Update a user's role |

### Products — `/products`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/products` | — | List products. Query params: `search`, `category`, `minPrice`, `maxPrice`, `sort`, `page`, `limit` |
| `GET` | `/products/:slug` | — | Get single product by slug |
| `POST` | `/products` | JWT + ADMIN | Create product |
| `PATCH` | `/products/:id` | JWT + ADMIN | Update product |

### Categories — `/categories`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/categories` | — | List all categories |

### Cart — `/cart` (all require JWT)

| Method | Path | Description |
|---|---|---|
| `GET` | `/cart` | Get current user's cart with nested product data |
| `POST` | `/cart` | Add item — body: `{ productId, quantity }` |
| `PATCH` | `/cart/:itemId` | Update quantity — body: `{ quantity }` |
| `DELETE` | `/cart/:itemId` | Remove item — 204 No Content |

### Orders — `/orders` (all require JWT)

| Method | Path | Description |
|---|---|---|
| `POST` | `/orders/checkout` | Convert cart to order, clears cart |
| `GET` | `/orders` | Get user's order list |
| `GET` | `/orders/:id` | Get single order with items |

---

## Auth Flow

**Token pair:**
- Access token — 15 min TTL (`AUTH_CONSTANTS.ACCESS_TOKEN_TTL_SECONDS = 900`)
- Refresh token — 7 day TTL (`AUTH_CONSTANTS.REFRESH_TOKEN_TTL_SECONDS = 604800`)
- Both defined in `packages/shared/src/index.ts`

**Guards:**
- `JwtAuthGuard` — validates Bearer token, injects `{ id, email, role }` into request
- `RolesGuard` — checks `@Roles(UserRole.ADMIN)` decorator against the injected user's role

**Refresh rotation (family-based):**
1. On `/auth/refresh`, incoming token hash is checked against DB.
2. If valid and not revoked: old token's `revokedAt` is set, a new token pair is issued with the same `family` UUID.
3. If the token was already revoked (possible theft): **all tokens in the same family are revoked** — forces re-login.

**Frontend interceptor** (`api/client.ts`):
- Catches 401 responses from Axios.
- Queues concurrent requests while a refresh is in flight.
- Calls `POST /api/auth/refresh`, stores new tokens, retries queued requests.
- If refresh fails, redirects to `/login`.

---

## Frontend Routes

Routes are defined in `apps/frontend/app/`.

### Public

| Path | Component | Description |
|---|---|---|
| `/` | `app/page.tsx` | Home page |
| `/products` | `app/products/page.tsx` | Product listing — categories sidebar, search/filter/sort/pagination, RSC + client filters |
| `/products/[slug]` | `app/products/[slug]/page.tsx` | Product detail — dynamic metadata via `generateMetadata` |

### Guest only `(guest)` — redirects away if logged in

| Path | Description |
|---|---|
| `/login` | Login form |
| `/register` | Register form |

### Protected `(protected)` — requires JWT, enforced by `RouteGuard`

| Path | Description |
|---|---|
| `/cart` | View cart, update quantities, remove items |
| `/checkout` | Order summary + place order button |
| `/checkout/success?orderId=...` | Order confirmation page |
| `/account/orders` | Order history list |
| `/account/orders/[id]` | Order detail |

---

## Frontend Data Layer

### Server-side fetching (`api/server.ts`)
Used in React Server Components. Calls the backend directly (not via the Next.js API proxy).
- `fetchCategories()` — cached 3600s
- `fetchProduct(slug)` — cached 60s

### Client-side fetching (`api/service.ts` + `hooks/`)
TanStack Query v5 hooks backed by Axios.

| Hook | File | Query keys | Purpose |
|---|---|---|---|
| `useAuth` | `hooks/useAuth.ts` | `["me"]` | Auth state, login/register/logout mutations |
| `useCart` | `hooks/useCart.ts` | `["cart"]` | Cart items, add/update/remove with optimistic updates + rollback |
| `useOrders` | `hooks/useOrders.ts` | `["orders"]`, `["orders", id]` | Fetch order list or single order |
| `useCheckout` | `hooks/useCheckout.ts` | — | Checkout mutation, invalidates cart + orders, redirects to success |

### Axios client (`api/client.ts`)
Single Axios instance with base URL pointing to Next.js API Route handlers (`/api/...`). Handles JWT refresh (see [Auth Flow](#auth-flow)).

---

## Shared Package

`packages/shared/src/index.ts` — consumed by both frontend and backend.

**Constants / enums:**
- `AUTH_CONSTANTS` — access/refresh token TTLs
- `UserRole` enum — `CUSTOMER`, `ADMIN`
- `OrderStatus` enum — `PENDING`, `PAID`, `SHIPPED`, `DELIVERED`, `CANCELLED`

**Interfaces:**
- `AuthUser` — `{ id, email, role }`
- `ILoginDto`, `IRegisterDto`
- `ICategory`, `IProduct`, `IProductsQuery`, `IPaginatedProducts`
- `ICartItem` (with nested `product`)
- `IOrder`, `IOrderItem` (with nested `product`)
- `IAddCartItemDto`, `IUpdateCartItemDto`

---

## Testing

### Backend (Jest)

| Type | Config | Coverage |
|---|---|---|
| Unit | default Jest | `auth.service`, `cart.service`, `orders.service`, `products.service` |
| E2E | `test/jest-e2e.json`, `.env.test` | Full HTTP-level tests against test DB |

Scripts: `npm run test:unit:backend`, `npm run test:e2e:backend`

### Frontend (Jest + Playwright)

| Type | Location | Description |
|---|---|---|
| Unit | `__tests__/` | Jest component/hook tests |
| Mocked E2E | `e2e/mocked/` | Playwright with mocked API routes — fast, no real backend needed |
| Smoke E2E | `e2e/smoke/` | Playwright against real test backend — full integration |

**Playwright setup:**
- `playwright.config.ts` spins up both frontend and test backend as `webServer` processes.
- Page objects: `e2e/pages/LoginPage.ts`, `CartPage.ts`, `CheckoutPage.ts`
- Auth fixtures: `e2e/fixtures/auth.ts` (pre-authenticated test context)
- Reporter: HTML; trace: `on-first-retry`

Scripts: `npm run test:unit:frontend`, `npm run test:e2e:frontend:mock`, `npm run test:e2e:frontend:smoke`

---

## Environment Variables

### Backend (`apps/backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `JWT_SECRET` | yes | Long random string for signing JWTs |
| `NODE_ENV` | yes | `local` \| `test` \| `production` |
| `PORT` | yes | Backend port (default 3001) |
| `FRONTEND_URL` | yes | CORS allowed origin |
| `ADMIN_EMAIL` | no | Bootstrap admin user on seed |
| `ADMIN_PASSWORD` | no | Bootstrap admin password |
| `ADMIN_NAME` | no | Bootstrap admin display name |

### Frontend (`apps/frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `BACKEND_URL` | yes | Backend base URL (`http://localhost:3001` dev, `3002` for test) |
| `PLAYWRIGHT_BASE_URL` | E2E only | Frontend base URL for Playwright (`http://localhost:3000`) |

---

## Deployment

### Frontend — Vercel

Config: `vercel.json` (repo root)

```json
{
  "buildCommand": "npm run build:vercel",
  "outputDirectory": "apps/frontend/.next",
  "installCommand": "npm ci",
  "framework": "nextjs"
}
```

`build:vercel` builds `@e-com/shared` then `@e-com/frontend`. The Next.js app acts as an API gateway — its Route Handlers proxy calls to the backend, keeping the backend URL server-side only.

### Backend — Render

Deployed via git integration. Connects to Supabase PostgreSQL (use Transaction mode pooler on port 6543 for production connections).
