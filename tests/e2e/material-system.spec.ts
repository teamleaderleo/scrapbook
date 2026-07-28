import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const studies = [
  { theme: 'light', width: 390, height: 844 },
  { theme: 'dark', width: 390, height: 844 },
  { theme: 'light', width: 1366, height: 768 },
  { theme: 'dark', width: 1440, height: 900 },
] as const;

function shiftedDigits(value: number, amount: number) {
  return Number(
    String(value)
      .slice(-4)
      .padStart(4, '0')
      .split('')
      .map((digit) => (Number(digit) + amount) % 10)
      .join(''),
  );
}

function activityDays() {
  const start = Date.UTC(2026, 5, 24);
  const dayMilliseconds = 24 * 60 * 60 * 1_000;
  return Array.from({ length: 35 }, (_, index) => ({
    date: new Date(start + index * dayMilliseconds).toISOString().slice(0, 10),
    count: index % 7,
  }));
}

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
    await expect(scoreboard).toBeVisible({ timeout: 15_000 });
    await expect(counter).toBeVisible();
    await expect(scoreboard.locator('[data-activity-digit]')).toHaveCount(4);
    await expect(counter.locator('[data-paper-digit]')).toHaveCount(4);
    await expect(scoreboard.getByText('7D', { exact: true })).toBeVisible();
    await expect(scoreboard.getByText('1Y', { exact: true })).toBeVisible();

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

    const minimumHeight = study.height <= 780 ? 232 : 248;
    await expect
      .poll(async () =>
        scoreboard.evaluate((element, expectedHeight) => {
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && rect.height >= expectedHeight;
        }, minimumHeight),
      )
      .toBe(true);
    const dimensions = await scoreboard.boundingBox();
    expect(dimensions).toBeTruthy();
    expect(dimensions!.width).toBeLessThanOrEqual(study.width);

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

  await page.route('**/api/github-activity', async (route) => {
    await responseGate;
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        source: 'public-profile',
        today: targetToday,
        weekTotal: 321,
        yearTotal: 4_321,
        days: activityDays(),
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
  await expect(counter).toBeVisible({ timeout: 15_000 });
  await refreshRequest;

  const initialLabel = await counter.getAttribute('aria-label');
  const initialToday = Number(initialLabel?.match(/^\d+/)?.[0] ?? 0);
  targetToday = shiftedDigits(initialToday, 5);

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

test('queues a newer activity value while paper leaves are still turning', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.addInitScript(() => {
    const actualNow = Date.now.bind(Date);
    let offset = 60 * 60 * 1_000;
    Date.now = () => actualNow() + offset;
    (window as Window & { __advanceActivityClock: (milliseconds: number) => void }).__advanceActivityClock =
      (milliseconds) => {
        offset += milliseconds;
      };
  });

  let releaseFirst!: () => void;
  let releaseSecond!: () => void;
  const gates = [
    new Promise<void>((resolve) => {
      releaseFirst = resolve;
    }),
    new Promise<void>((resolve) => {
      releaseSecond = resolve;
    }),
  ];
  let requestIndex = 0;
  let targets = [0, 0];

  await page.route('**/api/github-activity', async (route) => {
    const index = Math.min(requestIndex, 1);
    requestIndex += 1;
    await gates[index];
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        source: 'public-profile',
        today: targets[index],
        weekTotal: 654,
        yearTotal: 7_654,
        days: activityDays(),
        generatedAt: new Date(Date.now() + index * 1_000).toISOString(),
      }),
    });
  });

  const firstRequest = page.waitForRequest(
    (request) => new URL(request.url()).pathname === '/api/github-activity',
  );
  const response = await page.goto('/');
  expect(response?.ok()).toBe(true);

  const counter = page.locator('[data-paper-counter]');
  await expect(counter).toBeVisible({ timeout: 15_000 });
  await firstRequest;

  const initialLabel = await counter.getAttribute('aria-label');
  const initialToday = Number(initialLabel?.match(/^\d+/)?.[0] ?? 0);
  targets = [shiftedDigits(initialToday, 4), shiftedDigits(initialToday, 7)];
  releaseFirst();

  await expect(counter).toHaveAttribute('aria-label', `${targets[0]} contributions today`);
  const lastDigitFaces = counter
    .locator('[data-paper-digit]')
    .last()
    .locator('[aria-hidden="true"]');
  await expect(lastDigitFaces).toHaveCount(3, { timeout: 2_000 });

  const secondRequest = page.waitForRequest(
    (request) => new URL(request.url()).pathname === '/api/github-activity',
  );
  await page.evaluate(() => {
    (
      window as Window & { __advanceActivityClock: (milliseconds: number) => void }
    ).__advanceActivityClock(31_000);
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await secondRequest;
  releaseSecond();

  await expect(counter).toHaveAttribute('aria-label', `${targets[1]} contributions today`);
  await expect(counter.locator('[data-paper-digit] [aria-hidden="true"]')).toHaveCount(4, {
    timeout: 5_000,
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
  await expect(digit).toBeVisible({ timeout: 15_000 });
  await expect(counter).toHaveAttribute('data-reduced-motion', 'true');
  const before = await scoreboard.evaluate((element) => getComputedStyle(element).transform);
  await scoreboard.hover();
  const after = await scoreboard.evaluate((element) => getComputedStyle(element).transform);

  expect(after).toBe(before);
});

test('keeps paper digits readable in forced colours', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Forced-colour emulation is checked in Chromium.');

  await page.emulateMedia({ forcedColors: 'active' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const digit = page.locator('[data-activity-digit]').first();
  await expect(digit).toBeVisible({ timeout: 15_000 });
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
