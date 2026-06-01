import { test, expect, mockGetCart, mockRoute } from "../fixtures/auth";
import { mockCartItem, mockOrder } from "@/__tests__/fixtures/mock-data";
import { CheckoutPage } from "../pages/CheckoutPage";

test.describe("checkout", () => {
  test("shows order summary items", async ({ authenticatedPage: page }) => {
    await mockGetCart(page, [
      mockCartItem(),
      mockCartItem({ id: "item-2" }),
    ]);

    const checkoutPage = new CheckoutPage(page);
    await checkoutPage.goto();

    await checkoutPage.items().first().waitFor();
    expect(await checkoutPage.itemCount()).toBe(2);
  });

  test("empty cart shows empty state", async ({ authenticatedPage: page }) => {
    await mockGetCart(page, []);

    const checkoutPage = new CheckoutPage(page);
    await checkoutPage.goto();

    await expect(checkoutPage.emptyCartMessage()).toBeVisible();
  });

  test("place order navigates to success page with orderId", async ({
    authenticatedPage: page,
  }) => {
    const order = mockOrder();
    await mockGetCart(page, [mockCartItem()]);
    await mockRoute(page, "POST", "**/api/orders/checkout", order, 201);

    const checkoutPage = new CheckoutPage(page);
    await checkoutPage.goto();
    await checkoutPage.placeOrder();

    await page.waitForURL(new RegExp(`/checkout/success\\?orderId=${order.id}`));
  });

  test("place order failure shows error message", async ({
    authenticatedPage: page,
  }) => {
    await mockGetCart(page, [mockCartItem()]);
    await mockRoute(
      page,
      "POST",
      "**/api/orders/checkout",
      { message: "Payment failed", statusCode: 500 },
      500,
    );

    const checkoutPage = new CheckoutPage(page);
    await checkoutPage.goto();
    await checkoutPage.placeOrder();

    await expect(checkoutPage.errorMessage()).toBeVisible();
  });
});
