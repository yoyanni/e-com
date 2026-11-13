# 0011. The demo store tells search engines not to index it

- Status: Accepted
- Date: 2026-11-13

## Context

The store is a portfolio demo with fake products and no real checkout. It shouldn't show up in search results, where it could pass for a real shop. Vercel adds `X-Robots-Tag: noindex` to preview deployments only, not to production.

There are two standard ways to keep a site out of search results:

- A `robots.txt` with `Disallow: /` stops well-behaved crawlers from fetching pages. It doesn't stop indexing. A disallowed URL that's linked from elsewhere can still be listed, without a snippet, because the crawler never fetches the page and so never finds out it shouldn't be indexed.
- A `noindex` directive, in a `<meta name="robots">` tag or an `X-Robots-Tag` response header, removes a page from the index. The crawler has to be able to fetch the page to see it.

The two cancel each other out: a `Disallow` hides the `noindex`.

## Decision

- [`next.config.ts`](../../apps/frontend/next.config.ts) adds `X-Robots-Tag: noindex, nofollow` to every response with a `headers()` rule on `/:path*`. A header covers non-HTML responses too (images, the manifest, `/api/*` JSON), which a `<meta>` tag can't.
- There's no `robots.txt`, so crawlers can fetch pages and see the header.
- The header can't live on the backend instead. The route handlers and Server Components call the backend from the server and build their own responses, so the backend's headers never reach the store's pages ([decision 0001](0001-bff-route-handlers-hold-tokens.md)).
- Caddy adds the same header to the backend's own responses at `ecom-api.<domain>` ([deployment.md](../deployment.md#runtime-constraints)). Nothing links to the API, so this only matters if its URL gets out.

## Consequences

- Crawlers still visit the site and use a little bandwidth on Vercel.
- Crawlers that ignore `noindex` but obey `robots.txt`, such as some AI training crawlers, aren't kept out. Keeping them out would need a `robots.txt` that disallows them by user agent, which is safe as long as it doesn't also block the search engines.
- If the store ever goes live, delete the `headers()` rule and the Caddyfile line. A `robots.txt` added for some other reason has to leave the search engines allowed while the rule is there.
