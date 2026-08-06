import { expect, test } from '@playwright/test';

test('the contribution calendar previews and locks days on the scoreboard', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const response = await page.goto('/');
  expect(response?.ok()).toBe(true);

  const dashboard = page.locator('[data-home-activity-dashboard]:visible').last();
  const scoreboard = dashboard.locator('[data-activity-scoreboard]');
  const cells = dashboard.locator('[data-contribution-week-grid] button');
  const previewCell = dashboard
    .locator('[data-contribution-week-grid] button:not([data-contribution-selected="true"])')
    .first();

  await expect(scoreboard).toBeVisible({ timeout: 15_000 });
  await expect(cells.first()).toBeVisible();
  await expect(previewCell).toBeVisible();
  await expect(page.locator('[data-home-activity-loading]')).toHaveCount(0);

  const initialDate = await scoreboard.getAttribute('data-activity-score-date');
  const previewDate = await previewCell.getAttribute('data-contribution-date');

  expect(initialDate).toBeTruthy();
  expect(previewDate).toBeTruthy();
  expect(previewDate).not.toBe(initialDate);

  await previewCell.hover();
  await expect(scoreboard).toHaveAttribute('data-activity-score-date', previewDate!);

  await page.mouse.move(8, 8);
  await expect(scoreboard).toHaveAttribute('data-activity-score-date', initialDate!);

  await previewCell.click();
  await page.mouse.move(8, 8);
  await expect(scoreboard).toHaveAttribute('data-activity-score-date', previewDate!);
  await expect(previewCell).toHaveAttribute('aria-pressed', 'true');
});
