import { expect, test } from '@playwright/test';

test('shows a bounded repository-backed now shelf with canonical destinations', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.ok()).toBe(true);

  const shelf = page.locator('[data-home-now-shelf]');
  await expect(shelf).toBeVisible({ timeout: 15_000 });
  await expect(shelf.getByRole('heading', { name: 'On the desk' })).toBeVisible();

  const items = shelf.locator('[data-home-now-kind]');
  await expect(items).toHaveCount(3);

  await expect(shelf.locator('[data-home-now-kind="new dispatch"]')).toHaveAttribute(
    'href',
    /^\/desk\//
  );
  await expect(shelf.locator('[data-home-now-kind="studying"]')).toHaveAttribute(
    'href',
    /^\/space\/records\//
  );
  await expect(shelf.locator('[data-home-now-kind="agent visit"]')).toHaveAttribute(
    'href',
    /^\/gallery#visit-/
  );
});
