# 0001. Next.js route handlers hold the tokens in httpOnly cookies

- Status: Accepted
- Date: 2026-04-12

## Context

The backend is a stateless API that returns an access/refresh token pair in the response body and expects `Authorization: Bearer`. If the browser held those tokens, any XSS on the site could read them from JS-accessible storage.

## Decision

The browser never calls the backend. It calls Next.js route handlers under `app/api/`, which act as a backend-for-frontend (BFF):

- On login, register and refresh, the handler takes the tokens out of the backend's response and sets them as `httpOnly`, `sameSite=strict` cookies. The response body it returns contains no tokens.
- On every other call, the handler reads the `accessToken` cookie and forwards it as a `Bearer` header.

The backend itself doesn't know about cookies.

## Consequences

- Browser JavaScript can't read the tokens, and `sameSite=strict` blocks cross-site requests from carrying them.
- Every endpoint the browser needs requires a hand-written handler, and new backend endpoints aren't reachable from the client until one is added.
- Each request makes an extra hop through the Next.js server.
- The backend stays usable by other clients, such as Bruno or tests, with plain bearer tokens.
- CORS on the backend isn't strictly needed. It's still configured as a safeguard.
