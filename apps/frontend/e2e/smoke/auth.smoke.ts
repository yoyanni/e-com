import { test, expect, type Page } from "@playwright/test";

const PASSWORD = "Password123!";

/** Register a new unique user via the UI and land on /products. */
async function registerViaUI(page: Page) {
  const email = `smoke-auth-${Date.now()}@example.com`;

  await page.goto("/register");
  await page.getByLabel("Name").fill("Smoke User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: /register/i }).click();
  await page.waitForURL("**/products");

  return { email, password: PASSWORD };
}

test("register: creates account and lands on /products with active session", async ({
  page,
}) => {
  await registerViaUI(page);
  await expect(page.getByRole("button", { name: /logout/i })).toBeVisible();
});

test("login: authenticates existing user and lands on /products", async ({
  page,
  request,
}) => {
  // Create the user via the isolated request fixture so auth cookies from the
  // registration response don't leak into the page's cookie jar.
  const email = `smoke-login-${Date.now()}@example.com`;
  await request.post("/api/auth/register", {
    data: { name: "Smoke Login User", email, password: PASSWORD },
  });

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: /login/i }).click();
  await page.waitForURL("**/products");

  await expect(page.getByRole("button", { name: /logout/i })).toBeVisible();
});

test("logout: clears session and navigates to /", async ({ page, context }) => {
  await registerViaUI(page);

  await page.getByRole("button", { name: /logout/i }).click();

  await page.waitForURL("/");

  const cookies = await context.cookies();
  const tokenCookies = cookies.filter((c) =>
    ["accessToken", "refreshToken"].includes(c.name),
  );
  expect(tokenCookies).toHaveLength(0);
});
