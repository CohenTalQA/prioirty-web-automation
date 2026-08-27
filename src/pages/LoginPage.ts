import { expect, type Locator, type Page } from '@playwright/test';

export class LoginPage {
  readonly usernameLabel: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly forgotPasswordLink: Locator;
  readonly loginButton: Locator;

  constructor(private readonly page: Page) {
    this.usernameLabel = page.getByText('שם משתמש', { exact: true });
    // Priority's GWT login form exposes no ids, names, or labels on its inputs
    this.usernameInput = page.getByRole('textbox').first();
    this.passwordInput = page.locator('input[type="password"]');
    this.forgotPasswordLink = page.getByRole('link', { name: 'שכחת סיסמה?' });
    this.loginButton = page.getByRole('button', { name: 'כניסה' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  // The Priority web client boots slowly; allow up to a minute for the form
  async expectLoaded(): Promise<void> {
    await expect(this.usernameInput).toBeVisible({ timeout: 60_000 });
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
    await expect(this.forgotPasswordLink).toBeVisible();
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
