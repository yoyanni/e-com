import { test, expect } from "@playwright/test";
import { CartPage } from "../pages/CartPage";
import { CheckoutPage } from "../pages/CheckoutPage";

const PASSWORD = "Password123!";

test("full checkout: register → seed cart → checkout → success page", async ({
  page,
}) => {
  // 1. Register a new user via UI
  const email = `smoke-checkout-${Date.now()}@example.com`;
  await page.goto("/register");
  await page.getByLabel("Name").fill("Smoke Checkout User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: /register/i }).click();
  await page.waitForURL("**/products");

  // 2. Grab the first available product via API
  const productsRes = await page.request.get(`${process.env.BACKEND_URL}/products?limit=1`);
  expect(productsRes.ok()).toBeTruthy();
  const { data: products } = await productsRes.json();
  expect(products.length).toBeGreaterThan(0);
  const productId: string = products[0].id;

  // 3. Seed the cart via API (avoids dependency on product detail UI)
  const cartRes = await page.request.post("/api/cart", {
    data: { productId, quantity: 1 },
  });
  expect(cartRes.ok()).toBeTruthy();

  // 4. Cart UI — verify the seeded item appears
  const cartPage = new CartPage(page);
  await cartPage.goto();
  await expect(cartPage.items()).toHaveCount(1);

  // 5. Navigate to checkout
  await cartPage.checkoutLink().click();
  await page.waitForURL("**/checkout");

  // 6. Place the order
  const checkoutPage = new CheckoutPage(page);
  await checkoutPage.placeOrder();

  // 7. Verify success page with an orderId in the URL
  await page.waitForURL(/\/checkout\/success\?orderId=/);
  expect(page.url()).toMatch(/orderId=[\w-]+/);
});
