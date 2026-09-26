# 0003. `@e-com/shared` is compiled to CommonJS, not consumed as source

- Status: Accepted
- Date: 2026-05-05

## Context

The shared package started as types only, consumed as TypeScript source. It now also exports runtime values: `UserRole`, `OrderStatus` and `AUTH_CONSTANTS`. The NestJS backend compiles to CommonJS and loads `@e-com/shared` at runtime through `node_modules`, so it needs real JavaScript to import.

## Decision

`packages/shared` builds with `tsc` to CommonJS plus declarations in `dist/`, and its `package.json` `main`/`types` point there. Enums are written as `as const` objects with matching union types, not as TypeScript `enum`s.

## Consequences

- The shared package must be built before either app builds, runs or is type-checked. This is why `build` and `build:vercel` list `@e-com/shared` first (the order was fixed in commit 8ee1968).
- Changes in `packages/shared/src` don't reach the apps until you rebuild.
- Running `tsc --watch` in the package, or adding a `prepare` script, would remove the manual step.
