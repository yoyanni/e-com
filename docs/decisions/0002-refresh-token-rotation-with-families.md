# 0002. Refresh tokens rotate on every use, with reuse detection by family

- Status: Accepted
- Date: 2026-04-07

## Context

Access tokens are short-lived (15 minutes), so users need a long-lived refresh token (7 days). A refresh token that stays valid for its whole life is valuable to steal, and a stolen copy looks exactly like the real one.

## Decision

- Refresh tokens are random opaque strings, not JWTs. Only their SHA-256 hash is stored.
- Each refresh revokes the token it was given and issues a new one in the same `family`, a UUID created at login or register.
- If a revoked token is presented again, every active token in its family is revoked, which forces a new login.

## Consequences

- If a stolen token is used, the next refresh by either the attacker or the real user ends the session for both.
- A database leak doesn't expose usable refresh tokens.
- Two tabs refreshing at the same moment with the same cookie could trigger reuse detection and log the user out. The axios client reduces this within one tab by sharing a single in-flight refresh.
- Revoked and expired rows are never deleted, so `refresh_tokens` grows without limit.
