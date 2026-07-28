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
  test(`captures ${study.theme} scoreboard appearance at ${study.width}x${study.height}`, async ({
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

    const scoreboard = page.locator('[data-activity-scoreboard]');
    const counter = scoreboard.locator('[data-paper-counter]');
    await expect(scoreboard).toBeVisible();
    await expect(counter).toBeVisible();
    await expect(scoreboard.locator('[data-activity-digit]')).toHaveCount(4);
    await expect(counter.locator('[data-paper-digit]')).toHaveCount(4);
    await expect(scoreboard.getByText('7D', { exact: true })).toBeVisible();
    await expect(scoreboard.getByText('YTD', { exact: true })).toBeVisible();

    const paperFaces = await scoreboard.locator('[data-activity-digit]').evaluateAll((digits) =>
      digits.map((digit) => {
        const face = digit.querySelector<HTMLElement>('[aria-hidden="true"]');
        if (!face) throw new Error('Missing paper digit face');
        const style = getComputedStyle(face);
        return {
          backgroundImage: style.backgroundImage,
          borderStyle: style.borderStyle,
          transformStyle: getComputedStyle(digit.querySelector<HTMLElement>('[data-paper-digit]')!).transformStyle,
        };
      }),
    );
    for (const face of paperFaces) {
      expect(face.backgroundImage).not.toBe('none');
      expect(face.borderStyle).toBe('solid');
      expect(face.transformStyle).toBe('preserve-3d');
    }

    const overflow = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);

    const dimensions = await scoreboard.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });
    expect(dimensions.width).toBeGreaterThan(0);
    expect(dimensions.width).toBeLessThanOrEqual(study.width);
    expect(dimensions.height).toBeGreaterThanOrEqual(study.height <= 780 ? 232 : 248);

    const screenshotPath = path.join(
      'test-results',
      'scoreboard-appearance',
      study.theme,
      testInfo.project.name,
      `${study.width}x${study.height}.png`,
    );
    await mkdir(path.dirname(screenshotPath), { recursive: true });
    await page.screenshot({ path: screenshotPath, animations: 'disabled' });
  });
}

test('keeps the paper counter calm with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    window.localStorage.setItem('theme', 'system');
  });
  await page.goto('/');

  const scoreboard = page.locator('[data-activity-scoreboard]');
  const counter = scoreboard.locator('[data-paper-counter]');
  const digit = scoreboard.locator('[data-activity-digit]').first();
  await expect(digit).toBeVisible();
  await expect(counter).toHaveAttribute('data-reduced-motion', 'true');
  const before = await digit.evaluate((element) => (element as HTMLElement).style.transform);
  await digit.hover();
  const after = await digit.evaluate((element) => (element as HTMLElement).style.transform);

  expect(after).toBe(before);
});

test('keeps paper digits readable in forced colours', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Forced-colour emulation is checked in Chromium.');

  await page.emulateMedia({ forcedColors: 'active' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const digit = page.locator('[data-activity-digit]').first();
  await expect(digit).toBeVisible();
  const style = await digit.evaluate((element) => {
    const computed = window.getComputedStyle(element);
    return {
      color: computed.color,
      backgroundColor: computed.backgroundColor,
      borderStyle: computed.borderStyle,
    };
  });

  expect(style.color).not.toBe('rgba(0, 0, 0, 0)');
  expect(style.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(style.borderStyle).not.toBe('none');
});
