import type { Page, Locator } from "@playwright/test";

export class CartPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/cart");
  }

  items(): Locator {
    return this.page.getByTestId("cart-item");
  }

  async itemCount(): Promise<number> {
    return this.items().count();
  }

  /**
   * Returns locators scoped to a specific cart item row by its zero-based index.
   * Use this to interact with controls (qty buttons, remove) on a particular row.
   */
  item(index: number): Locator {
    return this.items().nth(index);
  }

  async increaseQty(index: number) {
    await this.item(index)
      .getByRole("button", { name: "Increase quantity" })
      .click();
  }

  async decreaseQty(index: number) {
    await this.item(index)
      .getByRole("button", { name: "Decrease quantity" })
      .click();
  }

  async removeItem(index: number) {
    await this.item(index).getByRole("button", { name: "Remove item" }).click();
  }

  checkoutLink(): Locator {
    return this.page.getByRole("link", { name: /proceed to checkout/i });
  }

  emptyCartMessage(): Locator {
    return this.page.getByText("Your cart is empty.");
  }
}
