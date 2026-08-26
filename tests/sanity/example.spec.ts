import { test } from '../../src/fixtures/test-fixtures.js';

test('example application is reachable', async ({ examplePage }) => {
  await examplePage.goto();
  await examplePage.expectLoaded();
});
