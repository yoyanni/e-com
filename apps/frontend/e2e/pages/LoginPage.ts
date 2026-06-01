import type { Page, Locator } from "@playwright/test";

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/login");
  }

  async fillEmail(email: string) {
    await this.page.getByLabel("Email").fill(email);
  }

  async fillPassword(password: string) {
    await this.page.getByLabel("Password").fill(password);
  }

  async submit() {
    await this.page.getByRole("button", { name: /login/i }).click();
  }

  async login(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }

  errorMessage(): Locator {
    return this.page.getByTestId("login-error");
  }
}
