import { test, expect } from "@playwright/test";

// Pages, route handlers and static files all tell crawlers not to index them.
for (const path of ["/", "/products", "/api/auth/me", "/icon-192.png"]) {
  test(`${path} sends X-Robots-Tag: noindex`, async ({ request }) => {
    const response = await request.get(path, { maxRedirects: 0 });

    expect(response.headers()["x-robots-tag"]).toBe("noindex, nofollow");
  });
}
