import { test, expect, mockGetCart } from "../fixtures/auth";
import { mockCartItem } from "@/__tests__/fixtures/mock-data";
import { CartPage } from "../pages/CartPage";

test.describe("cart", () => {
  test("displays cart items", async ({ authenticatedPage: page }) => {
    await mockGetCart(page, [
      mockCartItem(),
      mockCartItem({ id: "item-2", productId: "prod-2" }),
    ]);

    const cartPage = new CartPage(page);
    await cartPage.goto();

    await cartPage.items().first().waitFor();
    expect(await cartPage.itemCount()).toBe(2);
  });

  test("empty cart shows empty state message", async ({
    authenticatedPage: page,
  }) => {
    await mockGetCart(page, []);

    const cartPage = new CartPage(page);
    await cartPage.goto();

    await expect(cartPage.emptyCartMessage()).toBeVisible();
  });

  test("checkout link navigates to /checkout", async ({
    authenticatedPage: page,
  }) => {
    await mockGetCart(page, [mockCartItem()]);

    const cartPage = new CartPage(page);
    await cartPage.goto();
    await cartPage.checkoutLink().click();

    await page.waitForURL("**/checkout");
  });

  test("increase quantity sends PATCH with incremented quantity", async ({
    authenticatedPage: page,
  }) => {
    const item = mockCartItem({ quantity: 2 });
    let currentItems = [item];

    // Stateful GET mock — returns updated data after the PATCH settles
    await page.route("**/api/cart", (route) => {
      if (route.request().method() === "GET") {
        route.fulfill({ json: currentItems });
      } else {
        route.continue();
      }
    });

    await page.route("**/api/cart/**", (route) => {
      if (route.request().method() === "PATCH") {
        currentItems = [{ ...item, quantity: 3 }];
        route.fulfill({ json: { ...item, quantity: 3 } });
      } else {
        route.continue();
      }
    });

    const cartPage = new CartPage(page);
    await cartPage.goto();

    const patchRequest = page.waitForRequest(
      (req) => req.method() === "PATCH" && req.url().includes("/api/cart/"),
    );

    await cartPage.increaseQty(0);

    const req = await patchRequest;
    expect(JSON.parse(req.postData() ?? "{}")).toMatchObject({ quantity: 3 });
  });

  test("remove item sends DELETE and item disappears", async ({
    authenticatedPage: page,
  }) => {
    const item = mockCartItem();
    let currentItems = [item];

    // Stateful GET mock — returns empty after the DELETE settles
    await page.route("**/api/cart", (route) => {
      if (route.request().method() === "GET") {
        route.fulfill({ json: currentItems });
      } else {
        route.continue();
      }
    });

    await page.route("**/api/cart/**", (route) => {
      if (route.request().method() === "DELETE") {
        currentItems = [];
        route.fulfill({ status: 200, json: {} });
      } else {
        route.continue();
      }
    });

    const cartPage = new CartPage(page);
    await cartPage.goto();

    await cartPage.items().first().waitFor();
    expect(await cartPage.itemCount()).toBe(1);

    await cartPage.removeItem(0);

    await expect(cartPage.items()).toHaveCount(0);
  });
});
