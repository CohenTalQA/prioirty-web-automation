import { test } from '../../src/fixtures/test-fixtures.js';

test.describe('Login sanity', () => {
  test('login page loads with all sign-in controls', async ({ loginPage }) => {
    test.setTimeout(120_000);

    await loginPage.goto();
    await loginPage.expectLoaded();
  });
});
