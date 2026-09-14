const { test, expect } = require('@playwright/test');

// All three views (#view-log, #view-calendar, #view-history) stay in the DOM
// at once -- only CSS display toggles which one shows -- so `.history-title`
// etc. can exist in both #historyList and #calendarDayPanel simultaneously.
// Scope every assertion to #historyList to avoid a Playwright strict-mode
// "resolved to N elements" failure.

test.describe('Strength log', () => {
  test('a session with a title and notes shows up in History', async ({ page }) => {
    await page.goto('/');
    await page.locator('#strengthTitle').fill('Maximum Strength');
    await page.locator('#strengthNote').fill('Squat 5x5 @ 100kg');
    await page.locator('#strengthSubmitBtn').click();

    await page.locator('[data-tab="history"]').click();
    const history = page.locator('#historyList');
    await expect(history.locator('.history-title')).toHaveText('Maximum Strength');
    await expect(history.locator('.history-note')).toHaveText('Squat 5x5 @ 100kg');
  });

  test('a session with no title falls back to "Strength" as the heading', async ({ page }) => {
    await page.goto('/');
    await page.locator('#strengthSubmitBtn').click();

    await page.locator('[data-tab="history"]').click();
    await expect(page.locator('#historyList .history-title')).toHaveText('Strength');
  });

  test('editing a session updates it in place rather than duplicating it', async ({ page }) => {
    await page.goto('/');
    await page.locator('#strengthTitle').fill('First title');
    await page.locator('#strengthSubmitBtn').click();
    await page.locator('[data-tab="history"]').click();
    const history = page.locator('#historyList');

    await history.locator('[aria-label="Edit entry"]').click();
    await expect(page.locator('#strengthTitle')).toHaveValue('First title');
    await expect(page.locator('#strengthSubmitBtn')).toHaveText('Update workout');

    await page.locator('#strengthTitle').fill('Updated title');
    await page.locator('#strengthSubmitBtn').click();

    await page.locator('[data-tab="history"]').click();
    await expect(history.locator('.history-item')).toHaveCount(1);
    await expect(history.locator('.history-title')).toHaveText('Updated title');
  });

  test('deleting a session removes it after confirming', async ({ page }) => {
    await page.goto('/');
    await page.locator('#strengthSubmitBtn').click();
    await page.locator('[data-tab="history"]').click();
    const history = page.locator('#historyList');

    await history.locator('[aria-label="Delete entry"]').click();
    await page.getByText('Delete?').waitFor();
    await page.getByRole('button', { name: 'Yes', exact: true }).click();

    await expect(history.locator('.history-empty')).toBeVisible();
  });
});
