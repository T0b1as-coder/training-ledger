const { test, expect } = require('@playwright/test');

test.describe('Day streak', () => {
  test('starts at 0 with no sessions logged', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#streakValue')).toHaveText('0');
  });

  test('logging a session today sets the streak to 1, and it survives a reload', async ({ page }) => {
    await page.goto('/');
    await page.locator('#strengthSubmitBtn').click();
    await expect(page.locator('#streakValue')).toHaveText('1');

    await page.reload();
    await expect(page.locator('#streakValue')).toHaveText('1');
  });
});
