# Decision records

Short records of choices the code can't explain on its own. Add a record when a choice isn't obvious, would be expensive to reverse, or when someone is likely to ask "why didn't we just…?".

- Number records in order and never reuse a number.
- Don't rewrite an accepted record. If a decision changes, add a new record and set the old one's status to `Superseded by NNNN`.
- Add every record to the table below.

| # | Decision | Status |
| --- | --- | --- |
| [0001](0001-bff-route-handlers-hold-tokens.md) | Next.js route handlers hold the tokens in httpOnly cookies | Accepted |
| [0002](0002-refresh-token-rotation-with-families.md) | Refresh tokens rotate on every use, with reuse detection by family | Accepted |
| [0003](0003-shared-package-compiled-to-commonjs.md) | `@e-com/shared` is compiled to CommonJS, not consumed as source | Accepted |
| [0004](0004-schema-via-migrations-run-on-startup.md) | Schema comes only from migrations, applied on app startup | Accepted |
| [0005](0005-two-playwright-suites.md) | Two Playwright suites: mocked and smoke | Accepted |
| [0006](0006-two-layer-route-protection.md) | Protected routes are guarded by `proxy.ts` and by a client `RouteGuard` | Accepted |

Records 0001–0006 were written after the fact, on 2026-09-26, from the code, code comments and commit messages. Each one's date is the date of the commit that introduced the decision.

## Template

```markdown
# NNNN. Title

- Status: Proposed | Accepted | Superseded by NNNN
- Date: YYYY-MM-DD

## Context
What forced the decision.

## Decision
What was chosen.

## Consequences
What it costs, what it rules out, and alternatives for later.
```
