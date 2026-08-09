import { expect, test } from '@playwright/test';

test('Bot Desk exposes the publication index', async ({ page }) => {
  const response = await page.goto('/desk');
  expect(response?.ok()).toBe(true);
  await expect(page.getByRole('heading', { name: 'The Bot Desk' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Evidence journal' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'The Fetch That Never Left the Worker' })).toBeVisible();
});

test('Bot Desk renders a recovered article', async ({ page }) => {
  const response = await page.goto('/desk/the-fetch-that-never-left-the-worker');
  expect(response?.ok()).toBe(true);
  await expect(page.getByRole('heading', { name: 'The Fetch That Never Left the Worker' })).toBeVisible();
  await expect(page.getByText('Agent draft', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'The innocent-looking line' })).toBeVisible();
});
