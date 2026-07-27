import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
}

const studies = [
  { theme: 'light', width: 390, height: 844 },
  { theme: 'dark', width: 390, height: 844 },
  { theme: 'light', width: 1366, height: 768 },
  { theme: 'dark', width: 1440, height: 900 },
] as const;

for (const study of studies) {
  test(`captures ${study.theme} gallery repair at ${study.width}x${study.height}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: study.width, height: study.height });
    await page.addInitScript((theme) => localStorage.setItem('theme', theme), study.theme);

    const response = await page.goto('/gallery');
    expect(response?.ok()).toBe(true);
    await expect(
      page.getByRole('img', { name: /projected four-dimensional hypercube/i }),
    ).toBeVisible();
    await expect(page.getByText('Mothbit was here', { exact: true })).toHaveCount(0);

    const cards = page.locator('[data-agent-visit]');
    await expect(cards.first()).toHaveAttribute(
      'data-agent-visit',
      '2026-07-28-mica-oauth-rollout',
    );
    await expect(cards.locator('img')).toHaveCount(0);
    await expect(cards.locator('[data-agent-sigil-generation="2"]')).toHaveCount(9);
    await expect(
      cards.first().getByRole('img', { name: 'Mica agent identity sigil' }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);

    const screenshotPath = path.join(
      'test-results',
      'gallery-repair',
      study.theme,
      testInfo.project.name,
      `${study.width}x${study.height}.png`,
    );
    await mkdir(path.dirname(screenshotPath), { recursive: true });
    await page.screenshot({ path: screenshotPath, fullPage: true, animations: 'disabled' });
  });
}
