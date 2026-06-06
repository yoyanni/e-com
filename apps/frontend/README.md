# Frontend — Next.js App Router

The frontend is a Next.js application using the App Router. It communicates with the backend via Route Handlers (server) and an Axios client (browser), keeping auth tokens out of client-side JavaScript.

**Runs on:** `http://localhost:3000` (default)

## Architecture

### Request Flow

```
Browser
  └─ Axios client (/api/*)
       └─ Next.js Route Handlers (apps/frontend/api/)
            └─ NestJS backend (localhost:3001)
```

Client-side mutations (cart, auth, checkout) go through the Axios client. Server Components fetch data directly from the backend at build/request time using the native `fetch` API with Next.js caching.

### Data Fetching Strategy

| Context | Method | Used for |
|---|---|---|
| React Server Components | `fetch()` in `api/server.ts` | Products, categories (cached) |
| Client components | Axios + TanStack Query in `api/service.ts` | Cart, auth, orders |

Server-fetched data is cached: products revalidate every 60 s, categories every 3600 s.

### JWT Refresh

The Axios client (`api/client.ts`) includes a response interceptor that:
1. Catches `401` responses
2. Queues concurrent requests to prevent duplicate refresh calls
3. Calls `POST /auth/refresh` once, then retries all queued requests with the new token
4. Falls back to logout if refresh fails

## Directory Structure

```
apps/frontend/
├── app/                    # App Router pages and layouts
│   ├── layout.tsx          # Root layout (Navbar, Footer, Providers)
│   ├── page.tsx            # Home page
│   ├── products/           # Product listing and detail
│   │   ├── page.tsx
│   │   └── [slug]/page.tsx
│   ├── (guest)/            # Unauthenticated-only routes
│   │   ├── login/
│   │   └── register/
│   └── (protected)/        # JWT-required routes (RouteGuard enforced)
│       ├── layout.tsx
│       ├── cart/
│       ├── checkout/
│       └── account/orders/
├── components/             # UI and feature components
│   └── ui/                 # shadcn/ui base components
├── hooks/                  # TanStack Query hooks
│   ├── useAuth.ts
│   ├── useCart.ts
│   ├── useCheckout.ts
│   └── useOrders.ts
├── api/
│   ├── client.ts           # Axios instance with JWT refresh interceptor
│   ├── server.ts           # Server-side fetch helpers (products, categories)
│   └── service.ts          # Client-side API functions (auth, cart, orders)
├── lib/                    # Utilities (cn helper, etc.)
├── __tests__/              # Jest unit tests
└── e2e/                    # Playwright E2E tests
```

## Routes

### Public

| Route | Description |
|---|---|
| `/` | Home / landing page |
| `/products` | Product listing with search, filters, sort, pagination |
| `/products/[slug]` | Product detail page |
| `/login` | Login form |
| `/register` | Registration form |

### Protected (redirects to `/login` if unauthenticated)

| Route | Description |
|---|---|
| `/cart` | Shopping cart |
| `/checkout` | Place order |
| `/checkout/success` | Order confirmation |
| `/account/orders` | Order history |
| `/account/orders/[id]` | Order detail |

## Hooks

| Hook | Queries / Mutations |
|---|---|
| `useAuth` | `fetchMe`, `loginMutation`, `registerMutation`, `logoutMutation` |
| `useCart` | `fetchCart`, `addMutation`, `updateMutation`, `removeMutation` (with optimistic updates) |
| `useCheckout` | `checkoutMutation` |
| `useOrders` | `fetchOrders`, `fetchOrder(id)` |

Cart mutations use optimistic updates — the UI reflects the change immediately and rolls back on error.

## Local Setup

**1. Install dependencies** (from repo root):
```bash
npm install
```

**2. Create your env file:**
```bash
cp .env.example .env
```

**3. Start the dev server:**
```bash
npm run dev
```

The dev server proxies `/api/*` requests to the backend. Make sure the backend is also running.

## Environment Variables

| Variable | Description |
|---|---|
| `BACKEND_URL` | URL of the NestJS backend (e.g. `http://localhost:3001`) |
| `PLAYWRIGHT_BASE_URL` | Base URL for Playwright tests (e.g. `http://localhost:3000`) |

> For E2E tests against the test backend, set `BACKEND_URL=http://localhost:3002`.

## Testing

### Unit Tests (Jest + React Testing Library)

Tests live in `__tests__/` and co-located `*.spec.tsx` files.

```bash
npm run test            # Run all unit tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

### E2E Tests (Playwright)

Two separate Playwright configurations exist to cover different scenarios:

#### Smoke tests (`playwright.config.ts`)

Tests run against the real backend. They verify the full request cycle — authentication, navigation, and API calls — using actual data from the database.

```bash
npm run test:e2e:smoke
```

Prerequisites: `.env.test` configured with valid database credentials — Playwright starts and seeds the backend automatically.

#### Mocked tests (`playwright.mocked.config.ts`)

A local mock server intercepts all network requests and returns static fixtures. This makes tests deterministic and removes the backend dependency. Because Next.js Server Components fetch on the server, the mock server must be running to intercept those requests too.

```bash
npm run test:e2e:mock
```

#### Run all E2E or all tests

```bash
npm run test:e2e   # mocked + smoke
npm run test:all   # unit + mocked + smoke
```

**Debugging Playwright tests:**

```bash
# Step through tests interactively
npx playwright test --config=playwright.mocked.config.ts --debug
```

Reports are written to `playwright-report/` and artifacts to `test-results/`.
