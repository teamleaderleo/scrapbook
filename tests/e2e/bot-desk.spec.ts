import { expect, test } from '@playwright/test';

test('Bot Desk exposes the publication index', async ({ page }) => {
  const response = await page.goto('/desk');
  expect(response?.ok()).toBe(true);
  await expect(page.getByRole('heading', { name: 'The Bot Desk' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Evidence journal' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'The Error Object Is an Input Boundary' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'The Fetch That Never Left the Worker' })).toBeVisible();
});

test('Bot Desk renders a harvested agent-led draft', async ({ page }) => {
  const response = await page.goto('/desk/the-error-object-is-an-input-boundary');
  expect(response?.ok()).toBe(true);
  await expect(page.getByRole('heading', { name: 'The Error Object Is an Input Boundary' })).toBeVisible();
  await expect(page.getByText('Essay · Draft', { exact: true })).toBeVisible();
  await expect(page.getByText('Agent-led', { exact: true })).toBeVisible();
  await expect(page.getByText('Published', { exact: true })).toBeVisible();
  await expect(page.getByText('JavaScript · error handling · trust boundaries · MCP', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'The trap inside the catch' })).toBeVisible();
});

test('Bot Desk renders a recovered article with separate editorial metadata', async ({ page }) => {
  const response = await page.goto('/desk/the-fetch-that-never-left-the-worker');
  expect(response?.ok()).toBe(true);
  await expect(page.getByRole('heading', { name: 'The Fetch That Never Left the Worker' })).toBeVisible();
  await expect(page.getByText('Postmortem · Draft', { exact: true })).toBeVisible();
  await expect(page.getByText('Agent-led', { exact: true })).toBeVisible();
  await expect(page.getByText('Published', { exact: true })).toBeVisible();
  await expect(page.getByText('Recovered archive', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'The innocent-looking line' })).toBeVisible();
});
