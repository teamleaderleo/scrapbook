import { expect, test } from '@playwright/test';

test('agent journal renders repository records newest first with inspectable provenance', async ({ page }) => {
  await page.goto('/journal');

  await expect(page.getByRole('heading', { name: 'Agent journal', exact: true })).toBeVisible();
  await expect(page.getByText('2 entries', { exact: true })).toBeVisible();

  const entries = page.locator('[data-journal-entry]');
  await expect(entries).toHaveCount(2);
  await expect(entries.nth(0)).toHaveAttribute('data-journal-entry', '2026-07-26-agent-1-activity-cache');
  await expect(entries.nth(1)).toHaveAttribute('data-journal-entry', '2026-07-26-agent-2-preview-policy');

  const first = entries.first();
  await expect(first.getByRole('heading', { name: 'Cache Ledger', exact: true })).toBeVisible();
  await expect(first.getByText('Human directed', { exact: true })).toBeVisible();
  await expect(first.getByText('26 Jul 2026, 19:08 UTC', { exact: true })).toBeVisible();
  await expect(first.getByText('3 evidence items', { exact: true })).toBeVisible();

  const disclosure = first.locator('details[data-journal-provenance]');
  await expect(disclosure).not.toHaveAttribute('open', '');
  await disclosure.locator('summary').click();
  await expect(disclosure).toHaveAttribute('open', '');

  const evidenceLinks = disclosure.getByRole('link', { name: 'Open evidence' });
  await expect(evidenceLinks).toHaveCount(3);
  await expect(evidenceLinks.nth(0)).toHaveAttribute(
    'href',
    'https://github.com/teamleaderleo/scrapbook/pull/406',
  );
  await expect(evidenceLinks.nth(0)).toHaveAttribute('target', '_blank');
  await expect(evidenceLinks.nth(0)).toHaveAttribute('rel', /noreferrer/);

  await expect(page.locator('body')).not.toContainText('recordedBy');
  await expect(page.locator('body')).not.toContainText('repository-owner');
});

test('gallery links to the evidence journal without changing the guestbook wall', async ({ page }) => {
  await page.goto('/gallery');

  const journalLink = page.getByRole('link', { name: 'Open evidence journal', exact: true });
  await expect(journalLink).toHaveAttribute('href', '/journal');
  await expect(page.locator('[data-agent-visit]')).not.toHaveCount(0);
});

test('agent journal remains within a narrow mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto('/journal');

  await expect(page.getByRole('heading', { name: 'Agent journal', exact: true })).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
});

test('native provenance disclosure works without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  await page.goto('/journal');
  const first = page.locator('[data-journal-entry]').first();
  const disclosure = first.locator('details[data-journal-provenance]');

  await disclosure.locator('summary').click();
  await expect(disclosure).toHaveAttribute('open', '');
  await expect(disclosure.getByRole('link', { name: 'Open evidence' })).toHaveCount(3);

  await context.close();
});
