# Backend — NestJS REST API

The backend is a NestJS application serving a REST API for the e-commerce platform. It connects to a PostgreSQL database via TypeORM.

**Runs on:** `http://localhost:3001` (default)

## Architecture

The app follows NestJS's feature-module pattern. Each domain area is a self-contained module with its own controller, service, entities, and DTOs.

```
src/
├── auth/         # JWT auth, refresh token rotation, role guard
├── products/     # Product CRUD, search, filtering, pagination
├── categories/   # Category listing
├── cart/         # Per-user cart management
├── orders/       # Checkout and order history
├── db/
│   ├── migrations/      # TypeORM schema migrations
│   ├── seeds/           # Development/test data seeding
│   └── typeorm.config.ts
└── main.ts       # Bootstrap: CORS, global validation pipe
```

### Data Model

[View interactive diagram on dbdiagram.io](https://dbdiagram.io/d/69c4fab0fb2db18e3b0d2095)

```
User ──< Order ──< OrderItem >── Product
User ──< CartItem >──────────── Product
Product >── Category
```

| Entity | Key fields |
|---|---|
| `User` | `id`, `email`, `passwordHash`, `name`, `role` (CUSTOMER \| ADMIN) |
| `Product` | `id`, `name`, `slug` (unique), `description`, `price`, `stock`, `imageUrl`, `categoryId` |
| `Category` | `id`, `name`, `slug` |
| `CartItem` | `id`, `userId`, `productId`, `quantity` |
| `Order` | `id`, `userId`, `status`, `total` |
| `OrderItem` | `id`, `orderId`, `productId`, `quantity`, `unitPrice` |
| `RefreshToken` | Tracks invalidated tokens for logout |

Order lifecycle: `PENDING → PAID → SHIPPED → DELIVERED` (or `CANCELLED`)

### Authentication

- Login issues a short-lived JWT access token (15 min) and a long-lived refresh token (7 days).
- The refresh token is stored in an httpOnly cookie.
- `POST /auth/refresh` rotates the token — the old one is invalidated on use.
- Routes are protected with `JwtAuthGuard`; admin-only routes additionally use `RolesGuard`.

## Local Setup

**1. Install dependencies** (from repo root):
```bash
npm install
```

**2. Create your env file:**
```bash
cp .env.example .env
```

Edit `.env` with your local values (see [Environment Variables](#environment-variables) below).

**3. Run migrations:**
```bash
npm run migration:run
```

**4. (Optional) Seed development data:**
```bash
npm run seed:local
```

**5. Start the server:**
```bash
npm run start:dev
```

## Environment Variables

Copy `.env.example` to `.env`. All variables are required unless marked optional.

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWT tokens (use a long random string) |
| `NODE_ENV` | `local` \| `test` \| `production` |
| `PORT` | Port to listen on (default `3001`) |
| `FRONTEND_URL` | Frontend origin for CORS (e.g. `http://localhost:3000`) |
| `ADMIN_EMAIL` | _(optional)_ Bootstrap admin email — created on startup if missing |
| `ADMIN_PASSWORD` | _(optional)_ Bootstrap admin password |
| `ADMIN_NAME` | _(optional)_ Bootstrap admin display name |

> **Supabase note:** Use port `6543` in `DATABASE_URL` for the transaction-mode pooler.

## Database

### Migrations

```bash
# Generate a migration from entity changes
npm run migration:generate

# Apply pending migrations
npm run migration:run

# Roll back the last migration
npm run migration:revert
```

### Seeding

Seeds populate the database with categories, products, and a default customer account for development or testing.

```bash
npm run seed:local   # Uses .env
npm run seed:test    # Uses .env.test
npm run seed:prod    # Uses .env.prod
```

## API Reference

All endpoints are prefixed with the backend base URL. Protected routes require a `Bearer <token>` Authorization header.

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | — | Register a new user |
| `POST` | `/auth/login` | — | Login; returns access token + sets refresh cookie |
| `POST` | `/auth/refresh` | — | Rotate refresh token; returns new access token |
| `POST` | `/auth/logout` | JWT | Invalidate refresh token |
| `GET` | `/auth/me` | JWT | Get current user |
| `PATCH` | `/auth/users/:id/role` | Admin | Update a user's role |

**Register / Login body:**
```json
{ "email": "user@example.com", "password": "secret", "name": "Alice" }
```

**Login response:**
```json
{ "accessToken": "eyJ..." }
```

---

### Products

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/products` | — | List products with filters |
| `GET` | `/products/:slug` | — | Get a single product |
| `POST` | `/products` | Admin | Create a product |
| `PATCH` | `/products/:id` | Admin | Update a product |

**GET /products query parameters:**

| Param | Type | Description |
|---|---|---|
| `search` | string | Case-insensitive search on name & description |
| `category` | string | Category slug |
| `minPrice` | number | Minimum price |
| `maxPrice` | number | Maximum price |
| `sort` | `price_asc` \| `price_desc` \| `newest` \| `oldest` | Sort order |
| `page` | number | Page number (default `1`) |
| `limit` | number | Items per page (default `24`) |

**Response shape:**
```json
{
  "data": [{ "id": "...", "name": "...", "slug": "...", "price": "29.99", "stock": 10, ... }],
  "total": 120,
  "page": 1,
  "limit": 24
}
```

---

### Categories

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/categories` | — | List all categories |

---

### Cart

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/cart` | JWT | Get the current user's cart |
| `POST` | `/cart` | JWT | Add an item |
| `PATCH` | `/cart/:itemId` | JWT | Update item quantity |
| `DELETE` | `/cart/:itemId` | JWT | Remove an item (returns 204) |

**POST /cart body:** `{ "productId": "uuid", "quantity": 2 }`  
**PATCH /cart/:itemId body:** `{ "quantity": 3 }`

---

### Orders

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/orders/checkout` | JWT | Convert cart to an order |
| `GET` | `/orders` | JWT | List current user's orders |
| `GET` | `/orders/:id` | JWT | Get a specific order |

## Testing

```bash
# Unit tests
npm run test

# Unit tests in watch mode
npm run test:watch

# Unit test coverage
npm run test:coverage

# E2E tests (requires .env.test and a running test DB)
npm run test:e2e

# Unit + E2E tests
npm run test:all
```

Unit tests live alongside their source files as `*.spec.ts`. E2E tests live in `test/` and use Supertest against a real database.
