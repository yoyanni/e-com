# 0006. Protected routes are guarded by `proxy.ts` and by a client `RouteGuard`

- Status: Accepted
- Date: 2026-05-13

## Context

The server can see the auth cookies but can't cheaply tell whether they're valid, because that needs a backend call. The client can check validity with `/api/auth/me`, but only after the page has loaded. Earlier, prefetched protected pages were also being served from the client router cache after logout (fixed in commit 10bc0c4 on 2026-05-10).

## Decision

1. **`proxy.ts`** (Next.js middleware) redirects to `/login?redirectTo=…` when a protected path is requested with **neither** token cookie. It also sends users who have an access cookie away from `/login` and `/register`.
2. **`RouteGuard`**, which wraps the `(protected)` layout, waits for `useAuth` and redirects on the client when there's no valid user.
3. Links to protected pages use `prefetch={false}`.

## Consequences

- Logged-out visitors are redirected before any protected page renders. Visitors with a stale cookie see a spinner and then get redirected.
- Protected pages are client-rendered behind the guard, so they can't be Server Components that rely on the user.
- Protected paths are listed twice in `proxy.ts` (`PROTECTED_ROUTES` and `matcher`). The two lists must change together.
- Neither layer is the security boundary. The backend's `JwtAuthGuard` is.
