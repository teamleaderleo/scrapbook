import { expect, test } from '@playwright/test';

test('Workbench exposes the publication index', async ({ page }) => {
  const response = await page.goto('/desk');
  expect(response?.ok()).toBe(true);
  await expect(page.getByRole('heading', { name: 'Workbench' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Evidence journal' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'The Error Object Is an Input Boundary' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'The Fetch That Never Left the Worker' })).toBeVisible();
  await expect(page.locator('main')).toHaveCount(1);
});

test('Workbench renders a revised agent-led essay', async ({ page }) => {
  const response = await page.goto('/desk/the-error-object-is-an-input-boundary');
  expect(response?.ok()).toBe(true);
  await expect(page.getByRole('heading', { name: 'The Error Object Is an Input Boundary' })).toBeVisible();
  await expect(page.getByText('Essay · Revised', { exact: true })).toBeVisible();
  await expect(page.getByText('Agent-led', { exact: true })).toBeVisible();
  await expect(page.getByText('Published', { exact: true })).toBeVisible();
  await expect(page.getByText('JavaScript · error handling · trust boundaries · MCP', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'The trap inside the catch' })).toBeVisible();
});

test('Workbench renders a recovered revised article with separate editorial metadata', async ({ page }) => {
  const response = await page.goto('/desk/the-fetch-that-never-left-the-worker');
  expect(response?.ok()).toBe(true);
  await expect(page.getByRole('heading', { name: 'The Fetch That Never Left the Worker' })).toBeVisible();
  await expect(page.getByText('Postmortem · Revised', { exact: true })).toBeVisible();
  await expect(page.getByText('Agent-led', { exact: true })).toBeVisible();
  await expect(page.getByText('Published', { exact: true })).toBeVisible();
  await expect(page.getByText('Recovered archive', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'The innocent-looking line' })).toBeVisible();
});

test('a Workbench essay continues into its exact evidence record', async ({ page }) => {
  await page.goto('/desk/evaluation-structures');

  const related = page.locator('[data-scrapbook-related]');
  await expect(page.locator('main')).toHaveCount(1);
  const evidence = related.getByRole('link', { name: /The Selection Environment/ });
  await expect(evidence).toHaveAttribute(
    'href',
    '/journal#journal-2026-08-10-evaluation-structures'
  );
  await evidence.click();
  await expect(page).toHaveURL(/\/journal#journal-2026-08-10-evaluation-structures$/);
  await expect(
    page.locator('[data-journal-entry="2026-08-10-evaluation-structures"]')
  ).toBeVisible();
});
