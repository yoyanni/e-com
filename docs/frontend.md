# Frontend

This covers the Next.js 16 App Router app in [`apps/frontend/`](../apps/frontend). For where it sits in the system, see [architecture.md](architecture.md). For auth and route protection, see [auth.md](auth.md).

## Routes

| Path | Access | Rendering | Notes |
| --- | --- | --- | --- |
| `/` | public | server | Hero section with its own nav (`HeroNav`). The main `Navbar` stays hidden until the hero scrolls out of view |
| `/products` | public | server + client filters | See [Product listing](#product-listing) |
| `/products/[slug]` | public | server + client add-to-cart | `generateMetadata` for title/OG tags. If the fetch fails, it shows `notFound()` |
| `/login`, `/register` | guest only | client form | `(guest)` group |
| `/cart` | protected | client | `(protected)` group |
| `/checkout` | protected | client | Order summary and "Place order" |
| `/checkout/success?orderId=` | protected | server | Confirmation that only shows the id from the query string |
| `/account/orders` | protected | client | Order history |
| `/account/orders/[id]` | protected | client | Order detail with a status badge |

`app/products/error.tsx` and `app/products/[slug]/error.tsx` show a friendly message when the backend can't be reached. How guest-only and protected access is enforced is described in [auth.md](auth.md#route-protection).

## Product listing

All state lives in the URL query (`search`, `category`, `minPrice`, `maxPrice`, `sort`, `page`, `limit`), which is passed straight to `GET /products` ([api.md](api.md#products)).

- The navbar search box sets `search`.
- `FilterSidebar` sets the category, the price range (applied on blur) and the sort. Changing any of them resets `page`. "Clear filters" keeps only `search`.
- `Pagination` has Previous/Next buttons and a per-page choice of 12/24/48.
- `ProductGrid` is an async Server Component inside `<Suspense>`, with `ProductGridSkeleton` as the fallback.

## Data fetching

**Server Components** use [`api/server.ts`](../apps/frontend/api/server.ts). It's marked `server-only` and calls `BACKEND_URL` directly.

| Function | Cache (`next.revalidate`) |
| --- | --- |
| `fetchProducts(query)` | 60 s |
| `fetchProduct(slug)` | 60 s |
| `fetchCategories()` | 3600 s |

This means stock and price changes can take up to a minute to show on product pages.

**Client components** use TanStack Query hooks built on [`api/service.ts`](../apps/frontend/api/service.ts). Those go through the axios client (`baseURL: "/api"`) to the BFF route handlers.

| Hook | Query key | Provides |
| --- | --- | --- |
| [`useAuth`](../apps/frontend/hooks/useAuth.ts) | `["me"]` | `user`, `isAuthenticated`, and the login, register and logout mutations |
| [`useCart`](../apps/frontend/hooks/useCart.ts) | `["cart"]` | `cartItems`, `subtotal`, and the add, update and remove mutations |
| [`useOrders`](../apps/frontend/hooks/useOrders.ts) | `["orders"]` | Order list. `useOrder(id)` uses `["orders", id]` |
| [`useCheckout`](../apps/frontend/hooks/useCheckout.ts) | — | `checkoutMutation`. On success it invalidates cart and orders and goes to `/checkout/success` |

The query keys are exported as constants (`ME_QUERY_KEY`, `CART_QUERY_KEY`, `ORDERS_QUERY_KEY`). Import those rather than writing the arrays out again.

The cart mutations are **optimistic**. `onMutate` updates the cache (a new line gets a temporary `optimistic-<productId>` id), `onError` restores the snapshot, and `onSettled` refetches.

The navbar calls `useCart` and `useAuth` on every page, so a logged-out visitor makes `/api/cart` and `/api/auth/me` calls, and a refresh attempt, that all return `401`. That's expected. The cart badge is hidden when there's no user.

`QueryClient` defaults are set in [`components/Providers.tsx`](../apps/frontend/components/Providers.tsx): `staleTime` 5 min, `retry` 1, no refetch on window focus. `useAuth` overrides the last one. React Query Devtools are mounted.

To show an API error to the user, use [`getApiErrorMessage`](../apps/frontend/lib/getApiErrorMessage.ts). It prefers the backend's `message`, then `error`, then the Axios message.

## UI

- Tailwind CSS v4 with shadcn/ui components (`radix-nova` style, config in [`components.json`](../apps/frontend/components.json)) in `components/ui/`. Add new ones with the shadcn CLI.
- Light/dark/system theme through `next-themes` (`ThemeToggle` in the navbar). The theme tokens are in `app/globals.css`.
- The font is Inter, from `next/font`.
- `next/image` only allows remote images from `loremflickr.com` and `picsum.photos` ([`next.config.ts`](../apps/frontend/next.config.ts)), which are the hosts the seed uses. Add any other image host there.
