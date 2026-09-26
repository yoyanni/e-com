# Authentication and authorisation

Auth is split across two places. The backend issues and checks tokens ([`apps/backend/src/auth/`](../apps/backend/src/auth)). The Next.js BFF keeps the tokens in httpOnly cookies so browser JavaScript never sees them ([decision 0001](decisions/0001-bff-route-handlers-hold-tokens.md)). The endpoint contracts are in [api.md](api.md).

## Tokens

| Token | Format | Lifetime | Stored |
| --- | --- | --- | --- |
| Access | JWT signed with `JWT_SECRET`, payload `{ sub, email, role }` | `AUTH_CONSTANTS.ACCESS_TOKEN_TTL_SECONDS` (15 min) | Nowhere on the server. The backend only verifies it |
| Refresh | 64 random bytes as hex | 7 days | Only its SHA-256 hash, in `refresh_tokens` ([data-model.md](data-model.md)) |

`AUTH_CONSTANTS` lives in [`packages/shared/src/index.ts`](../packages/shared/src/index.ts). The backend passes the access TTL to `JwtModule`, and the BFF uses both TTLs as cookie `maxAge`. The refresh token's 7-day database expiry is hard-coded separately in `auth.service.ts` ([issue T3](issues.md#t3-refresh-token-lifetime-is-defined-twice)).

Register and login both return a new pair. Passwords are hashed with bcrypt (10 rounds).

The role is baked into the access token. After a role change, the user keeps their old role until their next refresh, which is at most 15 minutes away.

## Refresh rotation

`POST /auth/refresh` in [`auth.service.ts`](../apps/backend/src/auth/auth.service.ts) works like this ([decision 0002](decisions/0002-refresh-token-rotation-with-families.md)):

1. Hash the incoming token and look it up.
2. **If it's not found,** return `401`.
3. **If it's already revoked,** assume it was stolen and replayed. Revoke **every** active token in the same `family` and return `401`, so the user has to log in again.
4. **If it's expired,** return `401`.
5. **Otherwise,** set its `revokedAt` and issue a new pair in the **same family**.

Logout revokes only the refresh token it's given. An access token that has already been issued stays valid until it expires.

## Guards

- **`JwtAuthGuard`** (Passport `jwt` strategy, [`jwt.strategy.ts`](../apps/backend/src/auth/jwt.strategy.ts)) reads the `Bearer` header, rejects expired tokens and sets `req.user = { id, email, role }`. The app refuses to start if `JWT_SECRET` isn't set.
- **`RolesGuard`** plus **`@Roles(UserRole.ADMIN)`** returns `403` when `req.user.role` isn't in the list. Put it after `JwtAuthGuard`: `@UseGuards(JwtAuthGuard, RolesGuard)`.

## Admin bootstrap

[`admin-bootstrap.service.ts`](../apps/backend/src/auth/admin-bootstrap.service.ts) runs every time the app starts. If `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set and no user has that email yet, it creates an admin (`ADMIN_NAME`, default `Admin`). It never promotes or updates an existing user. After that, other users can only be promoted with `PATCH /auth/users/:id/role`.

## Cookies

The BFF handler [`app/api/auth/[action]/route.ts`](../apps/frontend/app/api/auth/[action]/route.ts) takes the pair from the backend's response and sets:

| Cookie | `maxAge` | Flags |
| --- | --- | --- |
| `accessToken` | 15 min | `httpOnly`, `sameSite=strict`, `path=/`, `secure` in production |
| `refreshToken` | 7 days | same |

Every other `/api/*` handler reads `accessToken` and sends it to the backend as `Authorization: Bearer …`. Logout deletes both cookies.

## Frontend flow

- **Silent refresh.** When a request returns `401`, the axios interceptor in [`api/client.ts`](../apps/frontend/api/client.ts) calls `POST /api/auth/refresh` and retries the request once. Concurrent `401`s share one in-flight refresh. If the refresh fails, the error is passed on and nothing redirects.
- **Current user.** `useAuth` ([`hooks/useAuth.ts`](../apps/frontend/hooks/useAuth.ts)) queries `["me"]` through `/api/auth/me`. Any failure resolves to `null`, which means logged out.
- **Login and register.** After login, `useAuth` invalidates `me` and `cart` and calls `router.refresh()`, which lets `proxy.ts` redirect the user back to `redirectTo`. After register, it goes to `/products`.
- **Logout** clears the whole query cache and goes to `/`.

## Route protection

Protection has two layers ([decision 0006](decisions/0006-two-layer-route-protection.md)):

1. **[`proxy.ts`](../apps/frontend/proxy.ts)** runs on the server before render and only checks whether the cookies **exist**. It doesn't validate them.
   - `/cart`, `/checkout`, `/account` with neither cookie → redirect to `/login?redirectTo=<path>`.
   - `/login`, `/register` with an `accessToken` cookie → redirect to `redirectTo` if it's a same-site path, otherwise to `/products`.
   - The protected prefixes are listed in `PROTECTED_ROUTES` **and** in `config.matcher`. Keep the two lists in sync.
2. **[`RouteGuard`](../apps/frontend/components/RouteGuard.tsx)**, which wraps everything in `app/(protected)/`, waits for `useAuth`. It shows a spinner while loading and, if there's no user, does `router.replace("/login?redirectTo=…")`. This catches cookies that exist but aren't valid any more.

Links to protected pages use `prefetch={false}`, so a prefetched page can't be served from a stale cache after logout.
