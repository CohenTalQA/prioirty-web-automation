import { expect, type Locator, type Page } from '@playwright/test';

export class HomePage {
  readonly personalMenuLink: Locator;
  readonly searchBox: Locator;
  readonly mainNavigation: Locator;
  readonly greetingHeading: Locator;
  readonly announcementsDialog: Locator;
  readonly announcementsCloseButton: Locator;

  constructor(private readonly page: Page) {
    this.personalMenuLink = page.getByRole('link', { name: 'תפריט אישי' });
    this.searchBox = page.getByRole('textbox', {
      name: /חיפוש לקוחות, מוצרים, מסמכים ועוד/,
    });
    this.mainNavigation = page.getByRole('navigation');
    // Greeting text changes by time of day (בוקר טוב / צהריים טובים / ערב טוב)
    this.greetingHeading = page.getByRole('heading', { level: 2, name: /טוב/ });
    this.announcementsDialog = page.getByRole('dialog');
    this.announcementsCloseButton = this.announcementsDialog.getByRole(
      'button',
      { name: 'Close' }
    );
  }

  userBadge(username: string): Locator {
    return this.page.getByText(username, { exact: true });
  }

  navigationLink(name: string): Locator {
    return this.mainNavigation.getByRole('link', { name });
  }

  // Priority occasionally shows an announcements popup right after login
  async dismissAnnouncementsIfShown(): Promise<void> {
    const closeButton = this.announcementsCloseButton.first();
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click();
      await expect(this.announcementsDialog).toBeHidden();
    }
  }

  // Login processing plus dashboard boot can take a while
  async expectLoggedIn(username: string): Promise<void> {
    await expect(this.userBadge(username)).toBeVisible({ timeout: 60_000 });
    await this.dismissAnnouncementsIfShown();
    await expect(this.personalMenuLink).toBeVisible();
    await expect(this.mainNavigation).toBeVisible();
  }
}
