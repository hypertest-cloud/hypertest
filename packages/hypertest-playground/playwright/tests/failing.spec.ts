import { test, expect } from '@playwright/test';

test.describe('Those tests will fail', () => {
  test('assertion failure example', async ({ page }) => {
    await page.goto('https://playwright.dev/');

    // This will fail because the actual text is "Playwright"
    // You will see a "diff" in the stacktrace (Expected vs Actual)
    await expect(page.locator('.navbar__title')).toHaveText(
      'Non-existent Text',
    );
  });

  test('timeout error example', async ({ page }) => {
    await page.goto('https://playwright.dev/');

    // This will fail after the default timeout (30s) because the selector doesn't exist.
    // The stacktrace will show logs of the "Actionability check"
    await page.click('#button-that-does-not-exist');
  });

  test('standard JS error example', async ({ page }) => {
    await page.goto('https://playwright.dev/');

    // Manually throwing an error to see a clean JS stacktrace
    throw new Error('Manual system failure triggered for testing');
  });
});
