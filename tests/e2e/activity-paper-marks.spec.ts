import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

function hydratedActivitySection(page: Page) {
  return page
    .locator('[data-home-activity-dashboard]:visible')
    .filter({ hasText: /UTC reset \d{2}:\d{2}:\d{2}/ })
    .last()
    .locator('[data-home-activity-grid]');
}

for (const theme of ['light', 'dark'] as const) {
  test(`activity days behave like paper marks in ${theme} mode`, async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize({ width: 1280, height: 760 });
    await page.addInitScript((selectedTheme) => {
      window.localStorage.setItem('theme', selectedTheme);
    }, theme);

    const response = await page.goto('/');
    expect(response?.ok()).toBe(true);

    const section = hydratedActivitySection(page);
    const grid = section.locator('[data-paper-activity-grid]');
    const marks = grid.locator('[data-paper-activity-mark]');
    await expect(section).toBeVisible({ timeout: 15_000 });
    await expect(grid).toBeVisible();
    await expect(marks).toHaveCount(28);

    const mark = marks.nth(8);
    const resting = await mark.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    });
    expect(resting.width).toBeGreaterThan(20);
    expect(resting.height).toBeGreaterThan(20);

    await mark.hover();
    await expect(mark).toHaveAttribute('aria-pressed', 'true');
    await expect
      .poll(() =>
        mark.evaluate((element) => Number(getComputedStyle(element, '::after').opacity)),
      )
      .toBeGreaterThan(0.2);
    await expect
      .poll(() =>
        mark.evaluate((element, restingY) => {
          const rect = element.getBoundingClientRect();
          return restingY - rect.y;
        }, resting.y),
      )
      .toBeGreaterThan(1.5);

    const directory = path.join(
      'test-results',
      'homepage-density',
      'activity-paper-marks',
      theme,
      testInfo.project.name,
    );
    await mkdir(directory, { recursive: true });
    await section.screenshot({
      path: path.join(directory, 'hover.png'),
      animations: 'allow',
    });
  });
}

test('activity paper marks stay planted with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    window.localStorage.setItem('theme', 'system');
  });
  await page.goto('/');

  const section = hydratedActivitySection(page);
  const mark = section.locator('[data-paper-activity-mark]').nth(8);
  await expect(mark).toBeVisible({ timeout: 15_000 });
  const before = await mark.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });

  await mark.hover({ force: true });
  await page.waitForTimeout(250);
  const after = await mark.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });

  expect(Math.abs(after.x - before.x)).toBeLessThan(0.75);
  expect(Math.abs(after.y - before.y)).toBeLessThan(0.75);
  expect(Math.abs(after.width - before.width)).toBeLessThan(0.75);
  expect(Math.abs(after.height - before.height)).toBeLessThan(0.75);
  await expect
    .poll(() => mark.evaluate((element) => getComputedStyle(element).transitionDuration))
    .toBe('0s');
});

test('forced colours removes paper mark decoration', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Forced-colour emulation is checked in Chromium.');

  await page.emulateMedia({ forcedColors: 'active' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const section = hydratedActivitySection(page);
  const mark = section.locator('[data-paper-activity-mark]').nth(8);
  await expect(mark).toBeVisible({ timeout: 15_000 });
  const decoration = await mark.evaluate((element) => ({
    before: getComputedStyle(element, '::before').display,
    after: getComputedStyle(element, '::after').display,
    border: getComputedStyle(element).borderStyle,
  }));

  expect(decoration.before).toBe('none');
  expect(decoration.after).toBe('none');
  expect(decoration.border).not.toBe('none');
});
