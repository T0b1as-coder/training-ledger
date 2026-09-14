const { test, expect } = require('@playwright/test');

test.describe('PWA basics', () => {
  test('the manifest is linked and valid, and the service worker activates', async ({ page }) => {
    await page.goto('/');

    const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(manifestHref).toBe('manifest.webmanifest');

    const manifestUrl = new URL(manifestHref, page.url()).href;
    const manifest = await (await page.request.get(manifestUrl)).json();
    expect(manifest.name).toBe('Training Ledger');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons.length).toBeGreaterThan(0);

    const active = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.ready;
      return !!reg.active;
    });
    expect(active).toBe(true);
  });
});
