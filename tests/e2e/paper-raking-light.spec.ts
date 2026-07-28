import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

function hydratedScoreboard(page: Page) {
  return page
    .locator('[data-activity-scoreboard]:visible')
    .filter({ hasText: /UTC reset \d{2}:\d{2}:\d{2}/ })
    .last();
}

for (const theme of ['light', 'dark'] as const) {
  test(`paper raking light follows the pointer in ${theme} mode`, async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize({ width: 1280, height: 760 });
    await page.addInitScript((selectedTheme) => {
      window.localStorage.setItem('theme', selectedTheme);
    }, theme);

    const response = await page.goto('/');
    expect(response?.ok()).toBe(true);

    const scoreboard = hydratedScoreboard(page);
    const light = scoreboard.locator('[data-paper-raking-light]');
    const fibres = scoreboard.locator('[data-paper-fibres]');
    const curl = scoreboard.locator('[data-paper-curl]');
    await expect(scoreboard).toBeVisible({ timeout: 15_000 });
    await expect(scoreboard).toHaveAttribute('data-paper-light-motion', 'full');
    await expect(light).toBeAttached();
    await expect(fibres).toBeAttached();
    await expect(curl).toBeAttached();

    const card = await scoreboard.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    });

    await page.mouse.move(card.x + card.width * 0.16, card.y + card.height * 0.82, {
      steps: 8,
    });
    await expect
      .poll(() => light.evaluate((element) => Number(getComputedStyle(element).opacity)))
      .toBeGreaterThan(0.55);
    await expect
      .poll(() => fibres.evaluate((element) => Number(getComputedStyle(element).opacity)))
      .toBeGreaterThan(0.5);
    await expect
      .poll(() => curl.evaluate((element) => Number(getComputedStyle(element).opacity)))
      .toBeGreaterThan(0.25);

    const firstLightTransform = await light.evaluate((element) => getComputedStyle(element).transform);
    const firstCurlOpacity = await curl.evaluate((element) => Number(getComputedStyle(element).opacity));

    const screenshotDirectory = path.join(
      'test-results',
      'scoreboard-appearance',
      'raking-light',
      theme,
      testInfo.project.name,
    );
    await mkdir(screenshotDirectory, { recursive: true });
    await scoreboard.screenshot({
      path: path.join(screenshotDirectory, 'lower-left.png'),
      animations: 'allow',
    });

    await page.mouse.move(card.x + card.width * 0.82, card.y + card.height * 0.24, {
      steps: 10,
    });
    await expect
      .poll(() => light.evaluate((element) => getComputedStyle(element).transform))
      .not.toBe(firstLightTransform);
    await expect
      .poll(() => curl.evaluate((element) => Number(getComputedStyle(element).opacity)))
      .toBeLessThan(firstCurlOpacity * 0.5);

    await scoreboard.screenshot({
      path: path.join(screenshotDirectory, 'upper-right.png'),
      animations: 'allow',
    });
  });
}

test('reduced motion keeps a static paper texture without tracking the pointer', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    window.localStorage.setItem('theme', 'system');
  });
  await page.goto('/');

  const scoreboard = hydratedScoreboard(page);
  const light = scoreboard.locator('[data-paper-raking-light]');
  const fibres = scoreboard.locator('[data-paper-fibres]');
  const curl = scoreboard.locator('[data-paper-curl]');
  await expect(scoreboard).toBeVisible({ timeout: 15_000 });
  await expect(scoreboard).toHaveAttribute('data-paper-light-motion', 'reduced');
  await scoreboard.hover({ force: true });

  const decoration = await page.evaluate(() => {
    const lightElement = document.querySelector<HTMLElement>('[data-paper-raking-light]');
    const fibreElement = document.querySelector<HTMLElement>('[data-paper-fibres]');
    const curlElement = document.querySelector<HTMLElement>('[data-paper-curl]');
    if (!lightElement || !fibreElement || !curlElement) {
      throw new Error('Missing paper-light decoration');
    }
    return {
      lightDisplay: getComputedStyle(lightElement).display,
      fibreOpacity: Number(getComputedStyle(fibreElement).opacity),
      curlDisplay: getComputedStyle(curlElement).display,
    };
  });

  expect(decoration.lightDisplay).toBe('none');
  expect(decoration.fibreOpacity).toBeCloseTo(0.12, 2);
  expect(decoration.curlDisplay).toBe('none');
  await expect(light).toBeAttached();
  await expect(fibres).toBeAttached();
  await expect(curl).toBeAttached();
});

test('forced colours removes paper-light decoration', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Forced-colour emulation is checked in Chromium.');

  await page.emulateMedia({ forcedColors: 'active' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const scoreboard = hydratedScoreboard(page);
  await expect(scoreboard).toBeVisible({ timeout: 15_000 });
  for (const selector of ['[data-paper-raking-light]', '[data-paper-fibres]', '[data-paper-curl]']) {
    await expect
      .poll(() => scoreboard.locator(selector).evaluate((element) => getComputedStyle(element).display))
      .toBe('none');
  }
});
