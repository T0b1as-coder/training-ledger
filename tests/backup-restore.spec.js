const { test, expect } = require('@playwright/test');

test.describe('Backup and restore', () => {
  test('export shows the current data as JSON', async ({ page }) => {
    await page.goto('/');
    await page.locator('#strengthTitle').fill('Export me');
    await page.locator('#strengthSubmitBtn').click();

    await page.locator('#backupBtn').click();
    const exported = await page.locator('#exportText').inputValue();
    const data = JSON.parse(exported);

    expect(data.strength).toHaveLength(1);
    expect(data.strength[0].title).toBe('Export me');
    expect(data.cardio).toEqual([]);
  });

  test('importing a backup replaces existing data', async ({ page }) => {
    await page.goto('/');
    await page.locator('#strengthSubmitBtn').click(); // logged, then wiped out by the import below

    const backup = JSON.stringify({
      strength: [],
      cardio: [{ id: 'c1', date: '2026-01-01', title: 'Imported run', activity: 'Run', note: '' }],
      planned: [],
    });

    await page.locator('#backupBtn').click();
    await page.locator('[data-backuptab="import"]').click();
    await page.locator('#importText').fill(backup);
    await page.locator('#loadImportBtn').click();

    await expect(page.locator('#importStatus')).toHaveText('Backup restored.');

    await page.locator('#closeBackup').click();
    await page.locator('[data-tab="history"]').click();
    const history = page.locator('#historyList');
    await expect(history.locator('.history-item')).toHaveCount(1);
    await expect(history.locator('.history-title')).toHaveText('Imported run');
  });

  test('a malformed backup is rejected, leaving existing data untouched', async ({ page }) => {
    await page.goto('/');
    await page.locator('#strengthTitle').fill('Keep me');
    await page.locator('#strengthSubmitBtn').click();

    await page.locator('#backupBtn').click();
    await page.locator('[data-backuptab="import"]').click();
    await page.locator('#importText').fill('{"not":"a backup"}');
    await page.locator('#loadImportBtn').click();

    await expect(page.locator('#importStatus')).toContainText('did not look like a Training Ledger backup');

    await page.locator('#closeBackup').click();
    await page.locator('[data-tab="history"]').click();
    await expect(page.locator('#historyList .history-title')).toHaveText('Keep me');
  });
});
