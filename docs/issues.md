# Known issues

Compiled on **2026-09-26** by reading the code at v1.2.0. O2 added on **2026-09-27** with the move to the VPS ([deployment.md](deployment.md)). When you fix an item, delete it in the same commit. When a doc turns out not to match the code, add an item here.

**Severity**

- **High:** loses data or money, or breaks a core flow for real users.
- **Medium:** a wrong result or error that users or operators will hit, but there's a workaround or the damage is limited.
- **Low:** rough edges, inconsistencies and latent risks.

**Fix first:** [B1](#b1-checkout-never-decrements-stock), [O1](#o1-seedprod-wipes-production-orders-and-products), [S1](#s1-no-rate-limiting-on-login-and-register).

IDs by category: **B** bugs, **S** security, **O** operations, **T** tooling. IDs aren't reused.

## Bugs

### B1. Checkout never decrements stock

- **Severity:** High
- **Where:** [orders.service.ts:31](../apps/backend/src/orders/orders.service.ts#L31)
- **Problem:** Checkout rejects a line whose quantity is more than `product.stock`, but it never subtracts the ordered quantity afterwards, so stock never goes down and one unit can be sold any number of times. The product rows also aren't locked, so two checkouts running at the same time could both pass the check even after stock is decremented.
- **Fix:** Inside the transaction, load the products with `lock: { mode: 'pessimistic_write' }` and decrement `stock`, or use a conditional `UPDATE … SET stock = stock - :q WHERE stock >= :q` and check the number of affected rows. Update the checkout paragraph in [api.md](api.md#orders).

### B2. Non-UUID ids cause a 500

- **Severity:** Medium
- **Where:** [orders.controller.ts:20](../apps/backend/src/orders/orders.controller.ts#L20), [products.controller.ts:41](../apps/backend/src/products/products.controller.ts#L41), [auth.controller.ts](../apps/backend/src/auth/auth.controller.ts) (`users/:id/role`)
- **Problem:** `GET /orders/abc` (or the other two routes) sends `abc` to Postgres as a `uuid`, which throws, and the client gets `500` instead of `400` or `404`. The frontend's `/account/orders/[id]` passes any URL segment straight through.
- **Fix:** Add `ParseUUIDPipe` as the cart controller does.

### B3. Add to cart fails silently when logged out

- **Severity:** Medium
- **Where:** [ProductDetail.tsx:40](../apps/frontend/app/products/[slug]/ProductDetail.tsx#L40)
- **Problem:** A guest clicks "Add to cart". The optimistic update shows briefly, `/api/cart` returns `401`, the refresh also fails, and the cart rolls back. There's no message and no redirect to login.
- **Fix:** When `useAuth().isAuthenticated` is false, send the user to `/login?redirectTo=<current path>`, and show `addMutation.error`.

### B4. Checkout shows the generic Axios error message

- **Severity:** Low
- **Where:** [checkout/page.tsx:63](../apps/frontend/app/(protected)/checkout/page.tsx#L63)
- **Problem:** When the cart has out-of-stock items, the user sees "Request failed with status code 400" instead of the backend's "Some items are out of stock".
- **Fix:** Use `getApiErrorMessage(checkoutMutation.error)`.

### B5. Money fields are strings typed as numbers

- **Severity:** Low
- **Where:** [packages/shared/src/index.ts:39](../packages/shared/src/index.ts#L39) (`price`), `:94` (`total`), `:86` (`unitPrice`)
- **Problem:** Postgres `numeric` reaches clients as a string ([data-model.md](data-model.md#money)). Any code that trusts the `number` type and uses `+` will concatenate strings instead of adding. The backend also adds up the checkout total in JS floating point.
- **Fix:** Either add a TypeORM column transformer that parses to number, or type the fields as `string` and keep converting where they're used. Calculate totals in cents or in SQL.

### B6. Order history isn't sorted

- **Severity:** Low
- **Where:** [orders.service.ts:63](../apps/backend/src/orders/orders.service.ts#L63)
- **Problem:** `GET /orders` has no `order`, so `/account/orders` lists orders in whatever order Postgres returns them.
- **Fix:** Add `order: { createdAt: 'DESC' }`.

### B7. Failed logout leaves the session in place

- **Severity:** Low
- **Where:** [useAuth.ts:42](../apps/frontend/hooks/useAuth.ts#L42), [app/api/auth/[action]/route.ts](../apps/frontend/app/api/auth/[action]/route.ts)
- **Problem:** Cookies are only cleared after the backend returns success, and the query cache is only cleared in `onSuccess`. If the `refreshToken` cookie is missing or the backend is down, the user stays logged in on the client.
- **Fix:** Always delete both cookies in the logout handler, and clear the cache in `onSettled`.

## Security

### S1. No rate limiting on login and register

- **Severity:** Medium
- **Where:** [auth.controller.ts](../apps/backend/src/auth/auth.controller.ts)
- **Problem:** `/auth/login` and `/auth/register` accept unlimited attempts, which leaves room for password guessing and account-creation spam.
- **Fix:** Add `@nestjs/throttler` to the auth routes, then document the limits in [api.md](api.md#auth).

## Operations

### O1. `seed:prod` wipes production orders and products

- **Severity:** High
- **Where:** [seed.ts:25](../apps/backend/src/db/seeds/seed.ts#L25), [apps/backend/package.json:25](../apps/backend/package.json#L25)
- **Problem:** The seed starts by deleting every order, order item, product and category, and through the cascade every cart item. `npm run seed:prod` does this to the production database without asking for confirmation.
- **Fix:** Refuse to run when `NODE_ENV=production` unless a flag such as `--force` is passed, or remove `seed:prod`. Update [data-model.md](data-model.md#seeding) and [deployment.md](deployment.md).

### O2. The production image can't seed

- **Severity:** Low
- **Where:** [seed.ts](../apps/backend/src/db/seeds/seed.ts), [Dockerfile](../Dockerfile)
- **Problem:** The seed runs through `ts-node` and uses `@faker-js/faker`, which are both dev dependencies and so aren't in the image. `seed:prod` from a laptop can't reach the Compose Postgres, which isn't exposed. A fresh VPS has no way to get sample data.
- **Fix:** Decide whether the demo needs seed data. If it does, move `@faker-js/faker` to `dependencies` and add a script that runs the compiled `dist/db/seeds/seed.js`, with the [O1](#o1-seedprod-wipes-production-orders-and-products) guard in place first.

## Tooling

### T1. Playwright suites can reuse the wrong server

- **Severity:** Medium
- **Where:** [playwright.config.ts:31](../apps/frontend/playwright.config.ts#L31), [playwright.mocked.config.ts:32](../apps/frontend/playwright.mocked.config.ts#L32)
- **Problem:** Both suites expect their own backend on `:3002` and a production build on `:3000`, and both set `reuseExistingServer: true`. If the smoke backend is still running, the mocked suite quietly tests against it (and the other way round). A `next dev` on `:3000` pointing at `:3001` also gets reused.
- **Fix:** Use different ports for each suite, or set `reuseExistingServer: !process.env.CI` and document the ports in [testing.md](testing.md#playwright).

### T2. Jest maps `server-only` to a file that doesn't exist

- **Severity:** Low
- **Where:** [jest.config.ts:10](../apps/frontend/jest.config.ts#L10)
- **Problem:** `__tests__/__mocks__/server-only.ts` doesn't exist, so the first test that imports `api/server.ts` will fail to resolve the module.
- **Fix:** Add an empty mock file, or remove the mapping.

### T3. Refresh-token lifetime is defined twice

- **Severity:** Low
- **Where:** [auth.service.ts:143](../apps/backend/src/auth/auth.service.ts#L143)
- **Problem:** The database expiry is hard-coded to 7 days, while the cookie uses `AUTH_CONSTANTS.REFRESH_TOKEN_TTL_SECONDS`. If one changes without the other, the cookie and the token stop agreeing.
- **Fix:** Use `AUTH_CONSTANTS.REFRESH_TOKEN_TTL_SECONDS * 1000`, then update [auth.md](auth.md#tokens).

### T4. `proxy.ts` route lists drift

- **Severity:** Low
- **Where:** [proxy.ts:4](../apps/frontend/proxy.ts#L4)
- **Problem:** `PROTECTED_ROUTES` includes `/orders`, which isn't a route and isn't in `config.matcher`. The two lists have to be kept in sync by hand.
- **Fix:** Remove `/orders`, and build `matcher` from the same constants if Next.js allows it (the matcher must be static).

### T5. `dotenv` is used but not declared in the frontend

- **Severity:** Low
- **Where:** [playwright.config.ts:2](../apps/frontend/playwright.config.ts#L2), [playwright.mocked.config.ts:2](../apps/frontend/playwright.mocked.config.ts#L2)
- **Problem:** `dotenv` only resolves because other packages install it transitively. A dependency upgrade could remove it and break Playwright. The backend declares it.
- **Fix:** Add `dotenv` to the frontend's `devDependencies`.
