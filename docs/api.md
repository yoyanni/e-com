# API

## Backend REST API

The base URL is `http://localhost:3001` in development. Protected routes need an `Authorization: Bearer <accessToken>` header. **JWT** means any logged-in user, and **Admin** means JWT plus `role = admin`. For how tokens are issued and rotated, see [auth.md](auth.md).

Errors use Nest's default shape, `{ "statusCode", "message", "error" }`. On validation failures, `message` is an array of strings. Unknown body fields are silently stripped.

A ready-made [Bruno](https://www.usebruno.com/) collection for these endpoints is in [`apps/backend/bruno/`](../apps/backend/bruno).

### Auth

Source: [`auth.controller.ts`](../apps/backend/src/auth/auth.controller.ts)

| Method | Path | Auth | Body | Success |
| --- | --- | --- | --- | --- |
| `POST` | `/auth/register` | — | `{ email, password, name }` | `201 { accessToken, refreshToken }` |
| `POST` | `/auth/login` | — | `{ email, password }` | `200 { accessToken, refreshToken }` |
| `POST` | `/auth/refresh` | — | `{ refreshToken }` | `200 { accessToken, refreshToken }` (a new pair) |
| `POST` | `/auth/logout` | — | `{ refreshToken }` | `204` |
| `GET` | `/auth/me` | JWT | — | `200 { id, email, role }` |
| `PATCH` | `/auth/users/:id/role` | Admin | `{ role: "customer" \| "admin" }` | `204` |

- `email` must be a valid email, and `password` must be at least 8 characters, on both register **and** login.
- Register returns `409` if the email is taken. Login returns `401 Invalid credentials` for an unknown email or a wrong password.
- Refresh returns `401` if the token is unknown, expired or already used. Reusing a token revokes its whole family ([auth.md](auth.md#refresh-rotation)).
- Logout with an unknown token still returns `204`.
- Changing your own role returns `400`, and an unknown user id returns `404`.

### Products

Source: [`products.controller.ts`](../apps/backend/src/products/products.controller.ts)

| Method | Path | Auth | Success |
| --- | --- | --- | --- |
| `GET` | `/products` | — | `200` paginated list |
| `GET` | `/products/:slug` | — | `200` product, `404` if missing |
| `POST` | `/products` | Admin | `201` product |
| `PATCH` | `/products/:id` | Admin | `200` product, `404` if missing |

**`GET /products` query parameters**

| Param | Type | Default | Effect |
| --- | --- | --- | --- |
| `search` | string | — | Case-insensitive `ILIKE` on name and description |
| `category` | string | — | Category **slug** |
| `minPrice`, `maxPrice` | number ≥ 0 | — | Inclusive price bounds |
| `sort` | `newest` \| `oldest` \| `price_asc` \| `price_desc` | `newest` | Any other value returns `400` |
| `page` | int ≥ 1 | `1` | |
| `limit` | int 1–100 | `24` | Above 100 returns `400`, to keep responses within the container's memory budget |

```json
{
  "data": [{ "id": "…", "name": "…", "slug": "…", "description": "…", "price": "29.99", "stock": 10,
             "imageUrl": "…", "categoryId": "…", "category": { "id": "…", "name": "…", "slug": "…" },
             "createdAt": "…", "updatedAt": "…" }],
  "total": 120,
  "page": 1,
  "limit": 24
}
```

`price` comes back as a **string**, because Postgres `numeric` isn't converted ([data-model.md](data-model.md#money)). The list and `GET /products/:slug` both include `category`.

**Create and update body:** `name` (required, non-empty), `price` (required, positive number), `description?`, `stock?` (≥ 0, default 0), `imageUrl?`, `categoryId?` (UUID). `PATCH` accepts any subset.

- The slug is generated from `name` on create. If it's taken, `-1`, `-2`, … is appended. **`PATCH` never changes the slug**, even when the name changes.
- A database error on save (for example, a `categoryId` that doesn't exist) returns `500 Failed to create/update product`.

### Categories

Source: [`categories.controller.ts`](../apps/backend/src/categories/categories.controller.ts)

| Method | Path | Auth | Success |
| --- | --- | --- | --- |
| `GET` | `/categories` | — | `200` array of `{ id, name, slug }`, sorted by name |

### Cart

Source: [`cart.controller.ts`](../apps/backend/src/cart/cart.controller.ts)

Every route needs JWT and only works on the caller's own items. `:itemId` must be a UUID, or the response is `400`.

| Method | Path | Body | Success |
| --- | --- | --- | --- |
| `GET` | `/cart` | — | `200` array of cart items, each with `product` (no category) |
| `POST` | `/cart` | `{ productId: uuid, quantity: int ≥ 1 }` | `201` the cart item |
| `PATCH` | `/cart/:itemId` | `{ quantity: int ≥ 1 }` | `200` the cart item |
| `DELETE` | `/cart/:itemId` | — | `204` |

- If the product is already in the cart, `POST` **adds** `quantity` to the existing line instead of creating a second one.
- Stock isn't checked when adding. It's only checked at checkout.
- An unknown product or cart item returns `404`.

### Orders

Source: [`orders.controller.ts`](../apps/backend/src/orders/orders.controller.ts)

Every route needs JWT and only sees the caller's own orders.

| Method | Path | Success |
| --- | --- | --- |
| `POST` | `/orders/checkout` | `201` the new order (without `items`) |
| `GET` | `/orders` | `200` array of orders with `items[].product` |
| `GET` | `/orders/:id` | `200` one order with `items[].product`, `404` if missing |

Checkout runs in one transaction. It loads the cart, returns `400 Cart is empty` or `400 Some items are out of stock` (when any line's quantity is more than the product's stock), and otherwise creates the order with status `pending` and `unitPrice` copied from the current product price. Then it deletes the cart items. It does **not** reduce stock ([issue B1](issues.md#b1-checkout-never-decrements-stock)).

### Other

`GET /` returns the string `Hello World!`.

`GET /health` returns `200 {"status":"ok"}`. It doesn't touch the database, so it only shows that the process is up. Nothing polls it on the VPS yet ([deployment.md](deployment.md#runtime-constraints)).

## Next.js route handlers (BFF)

These live in [`apps/frontend/app/api/`](../apps/frontend/app/api). The browser's axios client calls them. They forward requests to the backend and hold the tokens in cookies ([auth.md](auth.md#cookies)).

| Handler | Forwards to | Notes |
| --- | --- | --- |
| `POST /api/auth/login`, `/api/auth/register` | same path on backend | Sets both token cookies and responds `{ message }`. The tokens never go in the response body |
| `POST /api/auth/refresh` | `POST /auth/refresh` | Sends the `refreshToken` cookie as the body and resets both cookies. Returns `401` if there's no cookie |
| `POST /api/auth/logout` | `POST /auth/logout` | Sends the `refreshToken` cookie and deletes both cookies on success. Returns `401` if there's no cookie |
| `GET /api/auth/me` | `GET /auth/me` | |
| `GET`, `POST /api/cart` | `/cart` | |
| `PATCH`, `DELETE /api/cart/[itemId]` | `/cart/:itemId` | |
| `GET /api/orders` | `GET /orders` | |
| `GET /api/orders/[id]` | `GET /orders/:id` | |
| `POST /api/orders/checkout` | `POST /orders/checkout` | |

All handlers:

- Return `401` straight away when they need a token cookie and it's missing.
- Pass through the backend's status and JSON body.
- Return `500` if the call throws, for example when the backend is down or sends back a response that isn't JSON.

Any other `/api/auth/<action>` returns `400`. Product and category reads have no handlers, because Server Components fetch them directly. Admin endpoints have no handlers either and aren't reachable from the frontend.
