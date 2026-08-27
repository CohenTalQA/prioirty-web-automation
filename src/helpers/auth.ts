import { expect, type Locator, type Page } from '@playwright/test';
import type { LoginPage } from '../pages/LoginPage.js';

// Startup popups are optional; click the button only if its popup shows up in time
export async function dismissIfShown(
  button: Locator,
  timeout: number
): Promise<void> {
  try {
    await button.waitFor({ state: 'visible', timeout });
    await button.click();
  } catch {
    // popup was not shown - nothing to dismiss
  }
}

// Registers auto-handlers so Playwright dismisses Priority's popups whenever they appear during
// any action - some users get a license/error dialog that reappears throughout the session.
export async function registerPopupHandlers(page: Page): Promise<void> {
  // License/error dialog: a native <dialog> that only closes via its X (the OK button does not)
  await page.addLocatorHandler(
    page.locator('dialog[open][class*="errorMsg"]'),
    async (dialog) => {
      await dialog.getByRole('button', { name: 'dialog-close' }).click();
    }
  );
  // Announcements popup
  await page.addLocatorHandler(
    page.getByRole('button', { name: 'לא תודה' }),
    async (button) => {
      await button.click();
    }
  );
}

// Kept for callers that clear obstructions inside retry loops; the popup handlers above do most
// of the work, but this stays as a safety net that only touches the error dialog and announcements.
export async function clearObstructions(page: Page): Promise<void> {
  await dismissIfShown(
    page
      .locator('dialog[open][class*="errorMsg"]')
      .getByRole('button', { name: 'dialog-close' }),
    300
  );
  await dismissIfShown(page.getByRole('button', { name: 'לא תודה' }), 300);
}

// Logs a Priority user in and clears the startup popups (license, language, announcements),
// then asserts the dashboard shows the username. Shared by every user/role flow.
export async function signIn(
  page: Page,
  loginPage: LoginPage,
  username: string,
  password: string
): Promise<void> {
  await registerPopupHandlers(page);
  await loginPage.goto();
  await loginPage.expectLoaded();
  await loginPage.login(username, password);

  // The language popup is a GWT dialog that must be confirmed explicitly (it is not a real button,
  // and the license dialog sits on top of it). Doing it here - not as a handler - lets the license
  // handler fire to unclick the blocker, since handlers cannot run nested inside another handler.
  const languageDialog = page
    .locator('#PriModalDialog')
    .filter({ hasText: 'שפה Language' });
  const userBadge = page.getByText(username, { exact: true });
  await expect(async () => {
    if (await languageDialog.count()) {
      await languageDialog.locator('.FirstDialogButton').click();
    }
    await expect(userBadge).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 60_000 });
}
