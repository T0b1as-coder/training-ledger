const { test, expect } = require('@playwright/test');

test.describe('Calendar planning', () => {
  test('planning a strength session shows it as planned, then "Log now" completes it', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-tab="calendar"]').click();

    await page.getByRole('button', { name: '+ Plan strength', exact: true }).click();
    await expect(page.locator('#strengthSubmitBtn')).toHaveText('Save plan');

    await page.locator('#strengthTitle').fill('Planned strength');
    await page.locator('#strengthSubmitBtn').click();

    await page.locator('[data-tab="calendar"]').click();
    const dayPanel = page.locator('#calendarDayPanel');
    await expect(dayPanel.locator('.history-title')).toHaveText('Planned strength — planned');

    await dayPanel.getByRole('button', { name: 'Log now', exact: true }).click();
    await expect(page.locator('#strengthSubmitBtn')).toHaveText('Log this workout');
    await expect(page.locator('#strengthTitle')).toHaveValue('Planned strength');
    await page.locator('#strengthSubmitBtn').click();

    await page.locator('[data-tab="calendar"]').click();
    await expect(dayPanel.locator('.history-title')).toHaveText('Planned strength — completed');

    await page.locator('[data-tab="history"]').click();
    await expect(page.locator('.history-title')).toHaveText('Planned strength');
  });

  test('a planned session can be removed', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-tab="calendar"]').click();

    await page.getByRole('button', { name: '+ Plan cardio', exact: true }).click();
    await page.locator('#cardioSubmitBtn').click();

    await page.locator('[data-tab="calendar"]').click();
    const dayPanel = page.locator('#calendarDayPanel');
    await expect(dayPanel.locator('.history-item')).toHaveCount(1);

    await dayPanel.locator('[aria-label="Delete plan"]').click();
    await dayPanel.getByRole('button', { name: 'Yes', exact: true }).click();

    await expect(dayPanel.getByText('Nothing logged or planned for this day yet.')).toBeVisible();
  });
});
