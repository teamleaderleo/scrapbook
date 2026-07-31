import { expect, test } from '@playwright/test';

test('the retired resume route returns not found', async ({ page }) => {
  const response = await page.goto('/resume');
  expect(response?.status()).toBe(404);
  await expect(page.locator('body')).toBeVisible();
});

test('Site Atlas no longer advertises the retired resume', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-site-atlas-trigger]').click();

  await expect(page.locator('[data-site-atlas-link="resume"]')).toHaveCount(0);
});
