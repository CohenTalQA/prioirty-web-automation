// spec: specs/grant-doctor-permissions.plan.md
// seed: tests/seed.spec.ts

import type { Locator } from '@playwright/test';
import { expect, test } from '../../src/fixtures/test-fixtures.js';
import { env, requireEnv } from '../../src/utils/env.js';

const PROCEDURE_NAME = 'עדכון קבוצת הרשאות למשתמש';

// Startup popups are optional; click the button only if its popup shows up in time
async function dismissIfShown(button: Locator, timeout: number): Promise<void> {
  try {
    await button.waitFor({ state: 'visible', timeout });
    await button.click();
  } catch {
    // popup was not shown - nothing to dismiss
  }
}

test.describe('Admin grants doctor permissions', () => {
  test('Grant doctor permission group to provider user', async ({
    page,
    loginPage,
  }) => {
    test.setTimeout(300_000);
    const username = requireEnv(env.username, 'APP_USERNAME');
    const password = requireEnv(env.password, 'APP_PASSWORD');
    // Provider and group come from env so the doctor/admin users can be swapped later
    const provider = requireEnv(env.provider, 'PROVIDER');
    const permissionGroup = process.env.PERMISSION_GROUP ?? 'doctor';

    // 1. Navigate to BASE_URL and wait for the login form
    await loginPage.goto();
    await loginPage.expectLoaded();

    // 2. Login with the admin user (APP_USERNAME / APP_PASSWORD)
    await loginPage.login(username, password);

    // 3. Dismiss the blocking message dialog if shown (it intercepts clicks on the other popups)
    const messageDialog = page.locator('#pui-common-message-dialog');
    await dismissIfShown(
      messageDialog.getByRole('button', { name: 'אישור' }),
      30_000
    );

    // 4. Confirm Hebrew in the language popup if shown (it is a priModalDialog too)
    const languageDialog = page
      .locator('div.priModalDialog')
      .filter({ hasText: 'שפה Language' });
    await dismissIfShown(
      languageDialog.getByRole('button', { name: 'אישור' }),
      10_000
    );

    // 5. Dismiss the announcements popup with "לא תודה" if shown (can appear late)
    await dismissIfShown(page.getByRole('button', { name: 'לא תודה' }), 15_000);

    // 6. Verify the dashboard is visible with the admin username
    await expect(page.getByText(username, { exact: true })).toBeVisible({
      timeout: 60_000,
    });

    // 7. Open the menu search via the magnifier icon (no accessible name; id is the only stable hook),
    //    retrying if a late popup steals the click
    const searchDialog = page
      .locator('div.priModalDialog')
      .filter({ hasText: 'חיפוש בתפריט' });
    await expect(async () => {
      await dismissIfShown(
        page.getByRole('button', { name: 'לא תודה' }),
        1_000
      );
      await page.locator('#searchbottomHeader').click();
      await expect(searchDialog).toBeVisible({ timeout: 5_000 });
    }).toPass({ timeout: 60_000 });

    // 8. Search the menu for the permissions procedure
    await searchDialog.locator('input.TextBox_SearchFor').fill(PROCEDURE_NAME);
    await searchDialog.getByRole('button', { name: 'חיפוש' }).click();

    // 9. The first result is auto-selected (findEntSelected); wait for it
    const selectedResult = searchDialog.locator('div.findEntSelected');
    await expect(selectedResult).toHaveText(PROCEDURE_NAME);

    // 10. Launch with Enter - mouse clicks on the GWT הפעלה button are dropped in headless runs
    const paramsDialog = page
      .locator('div.priModalDialog')
      .filter({ hasText: 'קליטת פרמטרים' });
    await expect(async () => {
      await page.keyboard.press('Enter');
      await expect(paramsDialog).toBeVisible({ timeout: 10_000 });
    }).toPass({ timeout: 60_000 });

    // 11. Fill the parameters explicitly - never rely on values remembered from previous runs
    const userField = paramsDialog
      .getByRole('row', { name: /^משתמש/ })
      .getByRole('textbox')
      .first();
    const groupField = paramsDialog
      .getByRole('row', { name: /^קבוצה חדשה/ })
      .getByRole('textbox')
      .first();
    await userField.fill(provider);
    await groupField.fill(permissionGroup);
    await expect(userField).toHaveValue(provider);
    await expect(groupField).toHaveValue(permissionGroup);

    // 12. Submit the procedure parameters with אישור
    await paramsDialog.getByRole('button', { name: 'אישור' }).click();

    // 13. Wait for the "עדכון קבוצת הרשאות למשתמש" completion dialog and acknowledge it
    await expect(messageDialog).toBeVisible({ timeout: 120_000 });
    await expect(messageDialog).toContainText(PROCEDURE_NAME);
    await messageDialog.getByRole('button', { name: 'אישור' }).click();

    // 14. The Enter launch closes the search dialog automatically; close it if it survived
    await dismissIfShown(
      searchDialog.getByRole('button', { name: 'ביטול' }),
      2_000
    );

    // 15. Verify no modal dialogs remain
    await expect(searchDialog).toBeHidden();
    await expect(paramsDialog).toBeHidden();
    await expect(messageDialog).toBeHidden();

    // Manual review pause - inspect the result in headed Chromium before finishing
    await page.pause();
  });
});
