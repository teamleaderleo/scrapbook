import { expect, test } from '@playwright/test';

const retiredDashboardRoutes = [
  '/dashboard',
  '/dashboard/projects',
  '/dashboard/projects/example',
  '/dashboard/projects/example/edit',
  '/dashboard/blocks',
  '/dashboard/blocks/example/edit',
  '/dashboard/tags',
  '/dashboard/portfolio',
] as const;

test('legacy dashboard routes return not found', async ({ page }) => {
  for (const route of retiredDashboardRoutes) {
    const response = await page.goto(route);
    expect(response?.status()).toBe(404);
    await expect(page.locator('body')).toBeVisible();
  }
});

test('Space remains the active workspace after dashboard retirement', async ({ page }) => {
  const response = await page.goto('/space');
  expect(response?.ok()).toBe(true);
  await expect(page.locator('body')).toBeVisible();
  await expect(page).toHaveURL(/\/space$/);
});
