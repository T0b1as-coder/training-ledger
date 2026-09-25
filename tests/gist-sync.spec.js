const { test, expect } = require('@playwright/test');

// The Sync tab talks to api.github.com. Every test here intercepts that
// traffic with page.route() so nothing ever touches a real GitHub account or
// needs a real token -- there is deliberately no GitHub secret in CI for
// this. Never wire a real personal-use token into a CI secret for a public
// repo; mocking the API is the right call for testing a third-party
// integration like this one regardless.
//
// Also block the service worker for this file: it isn't what's under test
// (see pwa.spec.js), and its own fetch handling could otherwise interfere
// with page.route() intercepting the page's calls to api.github.com.
test.use({ serviceWorkers: 'block' });

const SYNC_KEY = 'trainingLedger.sync.v1';

function mockGistApi(page, { existingGistId = null, remoteData = null } = {}) {
  let gistId = existingGistId;
  let stored = remoteData;

  page.route('https://api.github.com/gists?per_page=100', async (route) => {
    const body = gistId ? [{ id: gistId, files: { 'trainingLedger.json': {} } }] : [];
    await route.fulfill({ json: body });
  });

  page.route('https://api.github.com/gists', async (route) => {
    if (route.request().method() !== 'POST') { await route.fallback(); return; }
    gistId = 'new-gist-id';
    const posted = JSON.parse(route.request().postData());
    stored = JSON.parse(posted.files['trainingLedger.json'].content);
    await route.fulfill({ json: { id: gistId } });
  });

  page.route(/https:\/\/api\.github\.com\/gists\/.+/, async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({ json: { files: { 'trainingLedger.json': { content: JSON.stringify(stored || {}), truncated: false } } } });
    } else if (method === 'PATCH') {
      const patched = JSON.parse(route.request().postData());
      stored = JSON.parse(patched.files['trainingLedger.json'].content);
      await route.fulfill({ json: { id: gistId } });
    } else {
      await route.fallback();
    }
  });

  return () => stored;
}

test.describe('Gist sync', () => {
  test('connecting with no existing gist creates one from local data', async ({ page }) => {
    const getStored = mockGistApi(page, { existingGistId: null });
    await page.goto('/');
    await page.locator('#strengthTitle').fill('Before connecting');
    await page.locator('#strengthSubmitBtn').click();

    await page.locator('#backupBtn').click();
    await page.locator('[data-backuptab="sync"]').click();
    await page.locator('#syncTokenInput').fill('fake-token');
    await page.locator('#connectSyncBtn').click();

    await expect(page.locator('#syncStatus')).toContainText('Connected');
    await expect(page.locator('#syncConnectedActions')).toBeVisible();
    await expect(page.locator('#syncConnectForm')).toBeHidden();

    const stored = getStored();
    expect(stored.strength[0].title).toBe('Before connecting');
  });

  test('a failed connect attempt shows an error and stays on the connect form', async ({ page }) => {
    await page.goto('/');
    await page.route(/https:\/\/api\.github\.com\/.*/, (route) => route.fulfill({ status: 401, json: { message: 'Bad credentials' } }));

    await page.locator('#backupBtn').click();
    await page.locator('[data-backuptab="sync"]').click();
    await page.locator('#syncTokenInput').fill('bad-token');
    await page.locator('#connectSyncBtn').click();

    await expect(page.locator('#syncStatus')).toContainText('Could not connect');
    await expect(page.locator('#syncConnectForm')).toBeVisible();
    await expect(page.locator('#syncConnectedActions')).toBeHidden();
  });

  test('saving after connecting pushes the change to the gist', async ({ page }) => {
    const getStored = mockGistApi(page, { existingGistId: 'g1', remoteData: { strength: [], cardio: [], planned: [], lastModified: 1 } });
    await page.goto('/');

    await page.locator('#backupBtn').click();
    await page.locator('[data-backuptab="sync"]').click();
    await page.locator('#syncTokenInput').fill('fake-token');
    await page.locator('#connectSyncBtn').click();
    await expect(page.locator('#syncStatus')).toContainText('Connected');
    await page.locator('#closeBackup').click();

    await page.locator('#strengthTitle').fill('Synced session');
    await page.locator('#strengthSubmitBtn').click();

    await expect.poll(() => getStored().strength?.[0]?.title).toBe('Synced session');
  });

  test('a newer remote copy is adopted on load', async ({ page }) => {
    mockGistApi(page, {
      existingGistId: 'g1',
      remoteData: {
        strength: [{ id: 'r1', date: '2026-01-01', title: 'From another device', note: '' }],
        cardio: [], planned: [], lastModified: 99999999999999
      },
    });
    await page.goto('/');
    // Simulate this device already being connected, skipping the connect UI.
    await page.evaluate((key) => {
      localStorage.setItem(key, JSON.stringify({ token: 'fake-token', gistId: 'g1' }));
    }, SYNC_KEY);
    await page.reload();

    await page.locator('[data-tab="history"]').click();
    await expect(page.locator('#historyList .history-title')).toHaveText('From another device');
  });

  test('an older remote copy is ignored on load', async ({ page }) => {
    mockGistApi(page, {
      existingGistId: 'g1',
      remoteData: { strength: [{ id: 'old', date: '2020-01-01', title: 'Old data', note: '' }], cardio: [], planned: [], lastModified: 1 },
    });
    await page.goto('/');
    await page.locator('#strengthTitle').fill('Local and newer');
    await page.locator('#strengthSubmitBtn').click(); // bumps lastModified to Date.now()

    await page.evaluate((key) => {
      localStorage.setItem(key, JSON.stringify({ token: 'fake-token', gistId: 'g1' }));
    }, SYNC_KEY);
    await page.reload();

    await page.locator('[data-tab="history"]').click();
    await expect(page.locator('#historyList .history-title')).toHaveText('Local and newer');
  });

  test('disconnecting stops syncing on this device', async ({ page }) => {
    mockGistApi(page, { existingGistId: 'g1', remoteData: { strength: [], cardio: [], planned: [], lastModified: 1 } });
    await page.goto('/');
    await page.evaluate((key) => {
      localStorage.setItem(key, JSON.stringify({ token: 'fake-token', gistId: 'g1' }));
    }, SYNC_KEY);
    await page.reload();

    await page.locator('#backupBtn').click();
    await page.locator('[data-backuptab="sync"]').click();
    await expect(page.locator('#syncConnectedActions')).toBeVisible();
    await page.locator('#disconnectSyncBtn').click();

    await expect(page.locator('#syncConnectForm')).toBeVisible();
    await expect(page.locator('#syncStatus')).toContainText('Not connected');

    const stored = await page.evaluate((key) => localStorage.getItem(key), SYNC_KEY);
    expect(stored).toBeNull();
  });
});
