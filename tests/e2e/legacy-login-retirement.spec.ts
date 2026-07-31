import { expect, test } from '@playwright/test';

test('the disconnected legacy login route returns not found', async ({ page }) => {
  const response = await page.goto('/login');
  expect(response?.status()).toBe(404);
  await expect(page.locator('body')).toBeVisible();
});

test('Space keeps the current Supabase auth route boundary', async ({ page }) => {
  await page.goto('/space');
  await expect(page).toHaveURL(/\/space$/);
  expect(page.url()).not.toContain('/login');
});
