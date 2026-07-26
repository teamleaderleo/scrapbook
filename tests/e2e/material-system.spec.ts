import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const studies = [
  { theme: 'light', width: 390, height: 844 },
  { theme: 'dark', width: 390, height: 844 },
  { theme: 'light', width: 1366, height: 768 },
  { theme: 'dark', width: 1440, height: 900 },
] as const;

for (const study of studies) {
  test(`captures ${study.theme} scoreboard material study at ${study.width}x${study.height}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: study.width, height: study.height });
    await page.addInitScript((theme) => {
      window.localStorage.setItem('theme', theme);
    }, study.theme);

    const response = await page.goto('/');
    expect(response?.ok()).toBe(true);

    const root = page.locator('html');
    if (study.theme === 'dark') {
      await expect(root).toHaveClass(/dark/);
    } else {
      await expect(root).toHaveClass(/light/);
    }

    const scoreboard = page.locator('[data-material-exemplar="scoreboard"]');
    await expect(scoreboard).toBeVisible();
    await expect(scoreboard).toHaveAttribute('data-material', 'steel');
    await expect(scoreboard.locator('[data-material="phenolic"]')).toHaveCount(4);
    await expect(scoreboard.locator('[data-material="slate"]')).toHaveCount(2);

    const digits = scoreboard.locator('[data-activity-digit]');
    const lens = digits.first().locator('.material-glass-lens');
    await expect(digits.first()).toBeVisible();
    await expect(lens).toHaveCSS('pointer-events', 'none');

    const overflow = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);

    const readWidth = () =>
      scoreboard.evaluate((element) => element.getBoundingClientRect().width);
    const readHeight = () =>
      scoreboard.evaluate((element) => element.getBoundingClientRect().height);
    await expect.poll(readWidth).toBeGreaterThan(0);
    await expect.poll(readWidth).toBeLessThanOrEqual(study.width);
    await expect
      .poll(readHeight)
      .toBeGreaterThanOrEqual(study.height <= 780 ? 232 : 248);

    const screenshotPath = path.join(
      'test-results',
      'material-system',
      study.theme,
      testInfo.project.name,
      `${study.width}x${study.height}.png`,
    );
    await mkdir(path.dirname(screenshotPath), { recursive: true });
    await page.screenshot({ path: screenshotPath, animations: 'disabled' });
  });
}

test('keeps the material exemplar calm with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    window.localStorage.setItem('theme', 'system');
  });
  await page.goto('/');

  const scoreboard = page.locator('[data-material-exemplar="scoreboard"]');
  const digit = scoreboard.locator('[data-activity-digit]').first();
  await expect(digit).toBeVisible();
  const before = await digit.evaluate((element) => element.style.transform);
  await digit.hover();
  const after = await digit.evaluate((element) => element.style.transform);
  const transitionDurationMs = await scoreboard.evaluate((element) => {
    const value = window.getComputedStyle(element).transitionDuration.split(',')[0]?.trim() ?? '';
    if (!value) return 0;
    const duration = Number.parseFloat(value);
    if (!Number.isFinite(duration)) return 0;
    return value.endsWith('ms') ? duration : duration * 1_000;
  });

  expect(after).toBe(before);
  expect(transitionDurationMs).toBeLessThanOrEqual(0.02);
});

test('keeps split-flap digits readable in forced colours', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Forced-colour emulation is checked in Chromium.');

  await page.emulateMedia({ forcedColors: 'active' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const digit = page.locator('[data-activity-digit]').first();
  const lens = digit.locator('.material-glass-lens');
  await expect(digit).toBeVisible();
  const lensAlpha = await lens.evaluate((element) => {
    const background = window.getComputedStyle(element).backgroundColor;
    const match = background.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/);
    return match ? Number.parseFloat(match[1]) : 1;
  });
  expect(lensAlpha).toBe(0);
  await expect(lens).toHaveCSS('pointer-events', 'none');
});
