// spec: doctor flow - change clinic, open customer, create proposal, mark it ready
// seed: tests/seed.spec.ts

import type { Locator, Page } from '@playwright/test';
import { expect, test } from '../../src/fixtures/test-fixtures.js';
import { env, requireEnv } from '../../src/utils/env.js';

// GWT form fields carry no accessible names; the label lives in the adjacent cell div[title]
function labeledField(page: Page, label: string): Locator {
  return page.locator(`td:has(> div[title="${label}"]) + td input`).first();
}

// Startup popups are optional; click the button only if its popup shows up in time
async function dismissIfShown(button: Locator, timeout: number): Promise<void> {
  try {
    await button.waitFor({ state: 'visible', timeout });
    await button.click();
  } catch {
    // popup was not shown - nothing to dismiss
  }
}

function todayShort(): string {
  // Priority renders dates as dd/mm/yy
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).format(new Date());
}
test.describe('Doctor proposal flow', () => {
  test('Doctor changes clinic, verifies customer eligibility and marks a proposal ready', async ({
    page,
    loginPage,
  }) => {
    test.setTimeout(420_000);
    const provider = requireEnv(env.provider, 'PROVIDER');
    const providerPassword = requireEnv(env.providerPassword, 'PROVIDAR_PASSWORD');
    const branch = requireEnv(env.branch, 'BRANCH');
    const customerId = requireEnv(env.customerId, 'CUSTOMER_ID');
    const treatmentCode = requireEnv(env.treatmentName, 'TREATMENT_NAME');
    const doctorName = process.env.DOCTOR_NAME ?? 'מסרי אחמד ד"ר';
    const today = todayShort();

    const messageDialog = page.locator('#pui-common-message-dialog');
    const lateAnnouncements = page.getByRole('button', { name: 'לא תודה' });
    const currentField = page.locator('input.priCurrentFieldStyle');

    const clearObstructions = async (): Promise<void> => {
      await dismissIfShown(lateAnnouncements, 500);
      await dismissIfShown(messageDialog.getByRole('button', { name: 'אישור' }), 500);
    };

    // 1. Login with the doctor user (PROVIDER / PROVIDAR_PASSWORD)
    await loginPage.goto();
    await loginPage.expectLoaded();
    await loginPage.login(provider, providerPassword);

    // 2. Dismiss the blocking message dialog if shown
    await dismissIfShown(messageDialog.getByRole('button', { name: 'אישור' }), 30_000);

    // 3. Confirm Hebrew in the language popup if shown
    const languageDialog = page.locator('div.priModalDialog').filter({ hasText: 'שפה Language' });
    await dismissIfShown(languageDialog.getByRole('button', { name: 'אישור' }), 10_000);

    // 4. Dismiss the announcements popup if shown (can appear late)
    await dismissIfShown(lateAnnouncements, 15_000);

    // 5. Verify the dashboard is visible with the doctor username
    await expect(page.getByText(provider, { exact: true })).toBeVisible({ timeout: 60_000 });

    // 6. Click change-clinic in the main navigation, retrying if a late popup steals the click
    await expect(async () => {
      await clearObstructions();
      await page.getByRole('navigation').getByRole('link', { name: 'שינוי מרפאה' }).click({ timeout: 5_000 });
    }).toPass({ timeout: 60_000 });

    // 7. Confirm the already-linked prompt when it appears
    const clinicConfirm = page.getByRole('dialog').filter({ hasText: 'האם ברצונך לשנות את המרפאה' });
    await dismissIfShown(clinicConfirm.getByRole('button', { name: 'אישור' }), 15_000);

    // 8. Fill the clinic number explicitly and confirm
    const clinicParams = page.locator('div.priModalDialog').filter({ hasText: 'קליטת פרמטרים' });
    await expect(clinicParams).toBeVisible({ timeout: 30_000 });
    const clinicField = clinicParams.getByRole('row', { name: /^מרפאה/ }).getByRole('textbox').first();
    await clinicField.fill(branch);
    await expect(clinicField).toHaveValue(branch);
    await clinicParams.getByRole('button', { name: 'אישור' }).click();

    // 9. Wait for the clinic-change completion popup and acknowledge it
    await expect(messageDialog).toBeVisible({ timeout: 60_000 });
    await expect(messageDialog).toContainText('הקישור למרפאה הושלם');
    await messageDialog.getByRole('button', { name: 'אישור' }).click();
    await expect(messageDialog).toBeHidden();
    // 10. Open the menu search via the magnifier icon (id is the only stable hook)
    const searchDialog = page.locator('div.priModalDialog').filter({ hasText: 'חיפוש בתפריט' });
    await clearObstructions();
    await page.locator('#searchbottomHeader').click();
    await expect(searchDialog).toBeVisible({ timeout: 30_000 });
    // 11. Search for the customers screen and select the exact match
    await searchDialog.locator('input.TextBox_SearchFor').fill('לקוחות');
    await searchDialog.getByRole('button', { name: 'חיפוש' }).click();
    const selectedResult = searchDialog.locator('div.findEntSelected');
    await searchDialog.locator('.searchEntityBottom').getByText('לקוחות', { exact: true }).first().click();
    await expect(selectedResult).toHaveText('לקוחות');
    // 12. Launch the customers screen with Enter on the selected row
    const customersTitle = page.getByRole('heading', { name: 'לקוחות', exact: true });
    await page.keyboard.press('Enter');
    await expect(customersTitle).toBeVisible({ timeout: 60_000 });
    // 13. Enter the customer number and move down with the arrow to load the record
    const customerField = labeledField(page, 'מס. לקוח');
    await customerField.click();
    await customerField.pressSequentially(customerId);
    await page.keyboard.press('ArrowDown');
    // 14. Verify the record filled; empty names mean no data arrived from Maccabi (known bug)
    await expect(labeledField(page, 'שם פרטי'), 'שם פרטי לא התמלא - לא התקבל מידע מחברת מכבי (באג ידוע)').not.toHaveValue('', { timeout: 60_000 });
    await expect(labeledField(page, 'שם משפחה'), 'שם משפחה לא התמלא - לא התקבל מידע מחברת מכבי (באג ידוע)').not.toHaveValue('', { timeout: 30_000 });
    // 15. Verify the last eligibility check date is today
    await expect(labeledField(page, 'ת.בדיקת זכאות אחרונה')).toHaveValue(today, { timeout: 30_000 });    // 16. Open the actions list with Ctrl+F5 and launch the proposal action via keyboard
    const actionsDialog = page.getByRole('dialog').filter({ hasText: 'פעולות' });
    await expect(async () => {
      await clearObstructions();
      await page.keyboard.press('Control+F5');
      await expect(actionsDialog).toBeVisible({ timeout: 10_000 });
    }).toPass({ timeout: 60_000 });
    const actionsFilter = actionsDialog.getByRole('textbox');
    await actionsFilter.pressSequentially('הצעה');
    await expect(actionsDialog.locator('[class*="Item-module_focused"]')).toHaveText('הצעה');
    await actionsFilter.press('Enter');
    await expect(actionsDialog).toBeHidden({ timeout: 30_000 });
    // 17. Fill the doctor when the prompt appears (skipped when Priority remembers it)
    const doctorPrompt = page.locator('div.priModalDialog').filter({ hasText: 'רופא' });
    try {
      await doctorPrompt.waitFor({ state: 'visible', timeout: 15_000 });
      const doctorField = doctorPrompt.getByRole('row', { name: /^רופא/ }).getByRole('textbox').first();
      await doctorField.fill(doctorName);
      await doctorPrompt.getByRole('button', { name: 'אישור' }).click();
    } catch {
      // prompt was not shown - the action used the current doctor
    }
    // 18. Open the child screens list with F5 and enter the proposals child screen
    const childScreensDialog = page.getByRole('dialog').filter({ hasText: 'מסכי בן' });
    await expect(async () => {
      await clearObstructions();
      await page.keyboard.press('F5');
      await expect(childScreensDialog).toBeVisible({ timeout: 10_000 });
    }).toPass({ timeout: 60_000 });
    const childFilter = childScreensDialog.getByRole('textbox');
    await childFilter.pressSequentially('הצעות');
    await expect(childScreensDialog.locator('[class*="Item-module_focused"]')).toHaveText('הצעות');
    await childFilter.press('Enter');
    await expect(page.getByRole('heading', { name: 'הצעות', exact: true })).toBeVisible({ timeout: 30_000 });
    // 19. Cursor lands on the today-date column; move right to the proposal number
    await expect(currentField).toBeVisible({ timeout: 30_000 });
    if ((await currentField.inputValue()) === today) {
      await currentField.press('ArrowRight');
    }
    await expect(currentField, 'הסמן אינו על הצעה שנפתחה היום').toHaveValue(/^CQ/);
    // 20. Press F6 twice to open the full proposals screen on this proposal
    await currentField.press('F6');
    await currentField.press('F6');
    const proposalsTitle = page.getByRole('heading', { name: 'הצעות מחיר ללקוח', exact: true });
    await expect(proposalsTitle).toBeVisible({ timeout: 60_000 });
    await expect(currentField).toHaveValue(/^CQ/);
    // 21. Descend to the detail child screen with F12
    const detailTitle = page.getByRole('heading', { name: 'הצעת מחיר ללקוח - פירוט', exact: true });
    await expect(async () => {
      await clearObstructions();
      await currentField.press('F12');
      await expect(detailTitle).toBeVisible({ timeout: 10_000 });
    }).toPass({ timeout: 60_000 });
    // 22. Enter the treatment code explicitly and move left so the row fills
    await expect(currentField).toBeVisible({ timeout: 30_000 });
    await currentField.press('Control+a');
    await currentField.pressSequentially(treatmentCode);
    await expect(currentField).toHaveValue(treatmentCode);
    await currentField.press('ArrowLeft');
    // 23. An informative popup may appear while the row fills - acknowledge and ignore it
    await dismissIfShown(messageDialog.getByRole('button', { name: 'אישור' }), 20_000);
    // 24. Return to the parent proposals screen with Esc
    await expect(async () => {
      await clearObstructions();
      await page.keyboard.press('Escape');
      await expect(detailTitle).toBeHidden({ timeout: 5_000 });
      await expect(proposalsTitle).toBeVisible({ timeout: 5_000 });
    }).toPass({ timeout: 60_000 });
    // 25. Change the proposal status from draft to ready
    const statusField = labeledField(page, 'סטטוס');
    await expect(statusField).toHaveValue('טיוטא', { timeout: 30_000 });
    await statusField.click();
    await statusField.press('Control+a');
    await statusField.pressSequentially('מוכנה');
    // 26. Move one row down with the arrow so the status change is committed
    await statusField.press('ArrowDown');
    await dismissIfShown(messageDialog.getByRole('button', { name: 'אישור' }), 10_000);
    await expect(statusField).toHaveValue('מוכנה', { timeout: 30_000 });
    // Manual review pause - inspect the result in headed Chromium before finishing
    await page.pause();
  });
});