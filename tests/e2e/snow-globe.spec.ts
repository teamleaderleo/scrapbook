import { expect, test } from '@playwright/test';

test('opens the snow globe from the site atlas', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.ok()).toBe(true);

  await page.locator('[data-site-atlas-trigger]').click();
  const link = page.locator('[data-site-atlas-link="snow-globe"]');
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', '/snow-globe');
  await link.click();

  await expect(page).toHaveURL(/\/snow-globe$/);
  await expect(page.getByRole('heading', { name: 'Snow globe', level: 1 })).toBeVisible();
  await expect(page.locator('[data-snow-globe-stage]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Shake the globe' })).toBeVisible();
});

test('supports pointer-driven globe motion without sensor access', async ({ page }) => {
  const response = await page.goto('/snow-globe');
  expect(response?.ok()).toBe(true);

  const stage = page.locator('[data-snow-globe-stage]');
  const bounds = await stage.boundingBox();
  expect(bounds).toBeTruthy();
  if (!bounds) return;

  await page.mouse.move(bounds.x + bounds.width * 0.45, bounds.y + bounds.height * 0.45);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width * 0.68, bounds.y + bounds.height * 0.62, {
    steps: 8,
  });
  await page.mouse.up();
  await page.getByRole('button', { name: 'Shake the globe' }).click();

  await expect(stage.locator('canvas')).toBeVisible();
});
