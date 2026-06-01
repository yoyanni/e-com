import { test, expect, mockGetCart, mockRoute } from "../fixtures/auth";
import { mockUser, mockCartItem } from "@/__tests__/fixtures/mock-data";
import { LoginPage } from "../pages/LoginPage";

const FAKE_COOKIES = [
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
];

// Any 401 triggers apiClient's interceptor → POST /api/auth/refresh.
// Mock it file-wide so it never reaches the Next.js BFF.
test.beforeEach(async ({ page }) => {
  await page.route("**/api/auth/refresh", (route) =>
    route.fulfill({
      status: 401,
      json: { statusCode: 401, message: "Unauthorized" },
    }),
  );
});

// Tests that start unauthenticated and don't change auth state
test.describe("route guards", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/auth/me", (route) =>
      route.fulfill({
        status: 401,
        json: { statusCode: 401, message: "Unauthorized" },
      }),
    );
    await page.route("**/api/cart", (route) =>
      route.fulfill({
        status: 401,
        json: { statusCode: 401, message: "Unauthorized" },
      }),
    );
  });

  test("unauthenticated access to /cart redirects to /login", async ({
    page,
  }) => {
    await page.goto("/cart");
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("/login");
  });

  test("login: wrong credentials shows error", async ({ page }) => {
    await mockRoute(
      page,
      "POST",
      "**/api/auth/login",
      { message: "Invalid credentials", statusCode: 401 },
      401,
    );

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("wrong@example.com", "wrongpassword");

    await expect(loginPage.errorMessage()).toBeVisible();
  });
});

// Login success — auth state transitions from unauthenticated to authenticated
test("login: success redirects to /products", async ({ page, context }) => {
  let authenticated = false;

  await page.route("**/api/auth/me", (route) =>
    authenticated
      ? route.fulfill({ json: mockUser() })
      : route.fulfill({ status: 401, json: {} }),
  );
  await page.route("**/api/cart", (route) =>
    route.fulfill({ status: 401, json: {} }),
  );
  await page.route("**/api/auth/login", async (route) => {
    await context.addCookies(FAKE_COOKIES);
    authenticated = true;
    await route.fulfill({ status: 200, json: { message: "login successful" } });
  });

  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login("test@example.com", "password123");

  await page.waitForURL("**/products");
});

// Register success — same auth state transition pattern
test("register: success navigates to /products", async ({ page, context }) => {
  let authenticated = false;

  await page.route("**/api/auth/me", (route) =>
    authenticated
      ? route.fulfill({ json: mockUser() })
      : route.fulfill({ status: 401, json: {} }),
  );
  await page.route("**/api/cart", (route) =>
    route.fulfill({ status: 401, json: {} }),
  );
  await page.route("**/api/auth/register", async (route) => {
    await context.addCookies(FAKE_COOKIES);
    authenticated = true;
    await route.fulfill({
      status: 201,
      json: { message: "register successful" },
    });
  });

  await page.goto("/register");
  await page.getByLabel("Name").fill("Test User");
  await page.getByLabel("Email").fill("newuser@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: /register/i }).click();

  await page.waitForURL("**/products");
});

// Tests that require an authenticated session
test.describe("authenticated", () => {
  test("guest guard: authenticated user on /login redirects to /products", async ({
    authenticatedPage: page,
  }) => {
    await mockGetCart(page, []);
    await page.goto("/login");
    await page.waitForURL("**/products");
  });

  test("logout: navigates to /", async ({ authenticatedPage: page }) => {
    await mockGetCart(page, [mockCartItem()]);
    await mockRoute(page, "POST", "**/api/auth/logout", null, 200);

    await page.goto("/products");
    await page.getByRole("button", { name: /logout/i }).click();

    await page.waitForURL("/");
  });
});
