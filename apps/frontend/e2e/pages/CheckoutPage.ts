import type { Page, Locator } from "@playwright/test";

export class CheckoutPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/checkout");
  }

  items(): Locator {
    return this.page.getByTestId("checkout-item");
  }

  async itemCount(): Promise<number> {
    return this.items().count();
  }

  async placeOrder() {
    await this.page.getByRole("button", { name: /place order/i }).click();
  }

  placeOrderButton(): Locator {
    return this.page.getByRole("button", { name: /place order/i });
  }

  errorMessage(): Locator {
    return this.page.getByTestId("checkout-error");
  }

  emptyCartMessage(): Locator {
    return this.page.getByText("Your cart is empty.");
  }
}
