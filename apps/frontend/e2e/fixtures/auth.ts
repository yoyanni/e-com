import { test as base, expect, type Page } from "@playwright/test";
import type { ICartItem } from "@e-com/shared";
import { mockUser } from "../../__tests__/fixtures/mock-data";

type E2EFixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<E2EFixtures>({
  authenticatedPage: async ({ page, context }, provide) => {
    // Inject fake tokens so Next.js middleware (server-side cookie check) allows through
    await context.addCookies([
      {
        name: "accessToken",
        value: "fake-access-token",
        domain: "localhost",
        path: "/",
        httpOnly: true,
        secure: false,
      },
      {
        name: "refreshToken",
        value: "fake-refresh-token",
        domain: "localhost",
        path: "/",
        httpOnly: true,
        secure: false,
      },
    ]);

    // Mock /api/auth/me so RouteGuard's useAuth resolves a user on the client
    await page.route("**/api/auth/me", (route) =>
      route.fulfill({ json: mockUser() }),
    );

    await provide(page);
  },
});

export { expect };

/**
 * Mock GET /api/cart. Other methods on the same route are passed through
 * so mutation calls (POST, PATCH, DELETE) can be mocked independently.
 */
export async function mockGetCart(page: Page, items: ICartItem[]) {
  await page.route("**/api/cart", (route) => {
    if (route.request().method() === "GET") {
      route.fulfill({ json: items });
    } else {
      route.continue();
    }
  });
}

/**
 * Generic route interceptor. Matches a single HTTP method on a URL pattern
 * and fulfills with the provided body. All other methods are passed through.
 */
export async function mockRoute(
  page: Page,
  method: string,
  urlPattern: string,
  body: unknown,
  status = 200,
) {
  await page.route(urlPattern, (route) => {
    if (route.request().method() === method.toUpperCase()) {
      route.fulfill({ status, json: body });
    } else {
      route.continue();
    }
  });
}
