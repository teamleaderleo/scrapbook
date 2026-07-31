import { expect, test } from '@playwright/test';

test('resume sections can be selected with the keyboard', async ({ page }) => {
  await page.goto('/resume');

  await expect(page.locator('[data-resume-detail-title]')).toHaveText(/Next\.js/);

  const gitInline = page.getByRole('button', { name: /Git Inline/ });
  await gitInline.focus();
  await page.keyboard.press('Enter');

  await expect(gitInline).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-resume-detail-title]')).toHaveText(/Git Inline/);
});

test('resume remains usable without horizontal overflow on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/resume');

  await page.getByRole('button', { name: /Scrapbook/ }).click();
  await expect(page.locator('[data-resume-detail-title]')).toHaveText(/Scrapbook/);

  const metrics = await page.evaluate(() => ({
    viewport: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewport + 1);
  expect(metrics.bodyWidth).toBeLessThanOrEqual(metrics.viewport + 1);
});

test('Site Atlas exposes the resume without promoting it to primary navigation', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-site-atlas-trigger]').click();

  await expect(page.locator('[data-site-atlas-link="resume"]')).toHaveAttribute('href', '/resume');
  await expect(page.locator('[data-site-primary-link="resume"]')).toHaveCount(0);
});
