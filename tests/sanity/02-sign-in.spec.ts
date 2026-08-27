import { expect, test } from '../../src/fixtures/test-fixtures.js';
import { env, requireEnv } from '../../src/utils/env.js';

test.describe('Sign-in sanity', () => {
  test('user can sign in and reach the home dashboard', async ({
    loginPage,
    homePage,
  }) => {
    test.setTimeout(180_000);
    const username = requireEnv(env.username, 'APP_USERNAME');
    const password = requireEnv(env.password, 'APP_PASSWORD');

    await loginPage.goto();
    await loginPage.expectLoaded();
    await loginPage.login(username, password);

    await homePage.expectLoggedIn(username);
    await expect(homePage.searchBox).toBeVisible();
    await expect(homePage.greetingHeading).toBeVisible();
  });

  test('main navigation exposes the core modules after sign-in', async ({
    loginPage,
    homePage,
  }) => {
    test.setTimeout(180_000);
    const username = requireEnv(env.username, 'APP_USERNAME');
    const password = requireEnv(env.password, 'APP_PASSWORD');

    await loginPage.goto();
    await loginPage.expectLoaded();
    await loginPage.login(username, password);
    await homePage.expectLoggedIn(username);

    for (const module of ['שינוי מרפאה', 'כספים', 'שווק ומכירות', 'רכש']) {
      await expect(homePage.navigationLink(module)).toBeVisible();
    }
  });
});
