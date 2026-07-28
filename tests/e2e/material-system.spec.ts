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
        const paperDigit = digit.querySelector<HTMLElement>('[data-paper-digit]');
        if (!face || !paperDigit) throw new Error('Missing paper digit face');
        const style = getComputedStyle(face);
        return {
          backgroundImage: style.backgroundImage,
          borderStyle: style.borderStyle,
          transformStyle: getComputedStyle(paperDigit).transformStyle,
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

test('captures the live paper counter choreography', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.addInitScript(() => {
    const actualNow = Date.now.bind(Date);
    Date.now = () => actualNow() + 60 * 60 * 1_000;
    window.localStorage.setItem('theme', 'light');
  });

  let releaseResponse!: () => void;
  const responseGate = new Promise<void>((resolve) => {
    releaseResponse = resolve;
  });
  let targetToday = 0;
  const days = Array.from({ length: 28 }, (_, index) => ({
    date: `2026-07-${String(index + 1).padStart(2, '0')}`,
    count: index % 7,
  }));

  await page.route('**/api/github-activity', async (route) => {
    await responseGate;
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        source: 'public-profile',
        today: targetToday,
        weekTotal: 321,
        yearTotal: 4_321,
        days,
        generatedAt: new Date().toISOString(),
      }),
    });
  });

  const refreshRequest = page.waitForRequest(
    (request) => new URL(request.url()).pathname === '/api/github-activity',
  );
  const response = await page.goto('/');
  expect(response?.ok()).toBe(true);

  const scoreboard = page.locator('[data-activity-scoreboard]');
  const counter = scoreboard.locator('[data-paper-counter]');
  await expect(counter).toBeVisible();
  await refreshRequest;

  const initialLabel = await counter.getAttribute('aria-label');
  const initialToday = Number(initialLabel?.match(/^\d+/)?.[0] ?? 0);
  const changedDigits = String(initialToday)
    .slice(-4)
    .padStart(4, '0')
    .split('')
    .map((digit) => (Number(digit) + 5) % 10)
    .join('');
  targetToday = Number(changedDigits);

  const frameDirectory = path.join(
    'test-results',
    'scoreboard-appearance',
    'motion',
    testInfo.project.name,
  );
  await mkdir(frameDirectory, { recursive: true });
  await scoreboard.screenshot({
    path: path.join(frameDirectory, '00-before.png'),
    animations: 'allow',
  });

  releaseResponse();
  const lastDigitFaces = counter
    .locator('[data-paper-digit]')
    .last()
    .locator('[aria-hidden="true"]');
  await expect(lastDigitFaces).toHaveCount(3, { timeout: 2_000 });
  await scoreboard.screenshot({
    path: path.join(frameDirectory, '01-lift.png'),
    animations: 'allow',
  });

  await page.waitForTimeout(220);
  await scoreboard.screenshot({
    path: path.join(frameDirectory, '02-turn.png'),
    animations: 'allow',
  });

  await page.waitForTimeout(300);
  await scoreboard.screenshot({
    path: path.join(frameDirectory, '03-ink.png'),
    animations: 'allow',
  });

  await expect(counter).toHaveAttribute(
    'aria-label',
    `${targetToday} contributions today`,
  );
  await expect(lastDigitFaces).toHaveCount(1, { timeout: 3_000 });
  await scoreboard.screenshot({
    path: path.join(frameDirectory, '04-settled.png'),
    animations: 'allow',
  });
});

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
