const { test, expect } = require('@playwright/test');

test.describe('Cardio log', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-logtype="cardio"]').click();
  });

  test('a titled session shows the title as heading and the activity as a subline', async ({ page }) => {
    await page.locator('#cardioActivity').selectOption('Run');
    await page.locator('#cardioTitle').fill('Hill session');
    await page.locator('#cardioNote').fill('42 min, 7.2 km');
    await page.locator('#cardioSubmitBtn').click();

    await page.locator('[data-tab="history"]').click();
    await expect(page.locator('.history-title')).toHaveText('Hill session');
    await expect(page.locator('.history-detail')).toHaveText('Run');
    await expect(page.locator('.history-note')).toHaveText('42 min, 7.2 km');
  });

  test('a session with no title uses the activity as the heading, with no subline', async ({ page }) => {
    await page.locator('#cardioActivity').selectOption('Bike');
    await page.locator('#cardioSubmitBtn').click();

    await page.locator('[data-tab="history"]').click();
    await expect(page.locator('.history-title')).toHaveText('Bike');
    await expect(page.locator('.history-detail')).toHaveCount(0);
  });

  test('choosing "Other" reveals a free-text activity field that becomes the heading', async ({ page }) => {
    await expect(page.locator('#cardioOtherRow')).toBeHidden();
    await page.locator('#cardioActivity').selectOption('Other');
    await expect(page.locator('#cardioOtherRow')).toBeVisible();

    await page.locator('#cardioActivityOther').fill('Hike');
    await page.locator('#cardioSubmitBtn').click();

    await page.locator('[data-tab="history"]').click();
    await expect(page.locator('.history-title')).toHaveText('Hike');
  });
});
