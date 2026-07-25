import { expect, test } from '@playwright/test';

const publicRoutes = ['/', '/time', '/blog', '/gallery', '/atelier'];

for (const route of publicRoutes) {
  test(`${route} renders`, async ({ page }) => {
    const response = await page.goto(route);
    expect(response?.ok()).toBe(true);
    await expect(page.locator('body')).toBeVisible();
  });
}

test('homepage fits within the viewport', async ({ page }) => {
  await page.goto('/');

  const dimensions = await page.evaluate(() => ({
    viewport: window.innerHeight,
    document: document.documentElement.scrollHeight,
  }));

  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
});

test.describe('connected-data routes', () => {
  test.skip(!process.env.PLAYWRIGHT_FULL_APP, 'Requires connected app environment variables');

  for (const route of ['/space', '/proxy-dashboard']) {
    test(`${route} renders`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.ok()).toBe(true);
      await expect(page.locator('body')).toBeVisible();
    });
  }
});
