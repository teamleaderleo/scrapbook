import { expect, test } from '@playwright/test';

test('Work presents a dense selected record with inspectable evidence', async ({
  page,
}) => {
  await page.goto('/work');

  await expect(
    page.getByRole('heading', { level: 1, name: 'Work' })
  ).toBeVisible();
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('[data-work-record]')).toHaveCount(5);
  await expect(page.locator('[data-work-record="preflight"]')).toContainText(
    '89.00s baseline → 15.53s accelerated'
  );
  await expect(
    page.getByRole('link', { name: 'AI SDK · deterministic URL matching' })
  ).toHaveAttribute('href', 'https://redirect.github.com/vercel/ai/pull/18570');
  await expect(
    page.getByRole('link', { name: 'Read as JSON' })
  ).toHaveAttribute('href', '/api/work');
});

test('Work keeps its index usable on a phone without horizontal overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/work');

  await page.getByRole('link', { name: /03 Stensibly/ }).click();
  await expect(page).toHaveURL(/\/work#stensibly$/);
  await expect(page.locator('[data-work-record="stensibly"]')).toBeVisible();

  const geometry = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth);
});
