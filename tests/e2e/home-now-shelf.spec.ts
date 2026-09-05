import { expect, test } from '@playwright/test';

test('shows a bounded repository-backed now shelf with canonical destinations', async ({
  page,
}) => {
  const response = await page.goto('/');
  expect(response?.ok()).toBe(true);

  const shelf = page.locator('[data-home-now-shelf]');
  await expect(shelf).toBeVisible({ timeout: 15_000 });
  await expect(
    shelf.getByRole('heading', { name: 'Latest changes' })
  ).toBeVisible();

  const items = shelf.locator('[data-home-now-kind]');
  await expect(items).toHaveCount(4);

  await expect(shelf.locator('[data-home-now-kind="Writing"]')).toHaveAttribute(
    'href',
    /^\/desk\//
  );
  await expect(shelf.locator('[data-home-now-kind="Study"]')).toHaveAttribute(
    'href',
    /^\/space\/records\//
  );
  await expect(
    shelf.locator('[data-home-now-kind="Knowledge"]')
  ).toHaveAttribute('href', /^\/knowledge\//);
});
