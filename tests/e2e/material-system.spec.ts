import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const studies = [
  { theme: 'light', width: 390, height: 844 },
  { theme: 'dark', width: 390, height: 844 },
  { theme: 'light', width: 1366, height: 768 },
  { theme: 'dark', width: 1440, height: 900 },
] as const;

function hydratedScoreboard(page: Page) {
  return page.locator('[data-activity-scoreboard]:visible').last();
}

function shiftedDigits(value: number, amount: number) {
  return Number(
    String(value)
      .slice(-4)
      .padStart(4, '0')
      .split('')
      .map(digit => (Number(digit) + amount) % 10)
      .join('')
  );
}

function activityDays(today: number = 6, generatedAt: Date = new Date()) {
  const dayMilliseconds = 24 * 60 * 60 * 1_000;
  const end = Date.UTC(
    generatedAt.getUTCFullYear(),
    generatedAt.getUTCMonth(),
    generatedAt.getUTCDate()
  );
  const start = end - 34 * dayMilliseconds;
  return Array.from({ length: 35 }, (_, index) => ({
    date: new Date(start + index * dayMilliseconds).toISOString().slice(0, 10),
    count: index === 34 ? today : index % 7,
  }));
}

for (const study of studies) {
  test(`captures ${study.theme} scoreboard appearance at ${study.width}x${study.height}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: study.width, height: study.height });
    await page.addInitScript(theme => {
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

    const scoreboard = hydratedScoreboard(page);
    const counter = scoreboard.locator('[data-paper-counter]');
    await expect(scoreboard).toBeVisible({ timeout: 15_000 });
    await expect(counter).toBeVisible();
    await expect(scoreboard.locator('[data-activity-digit]')).toHaveCount(4);
    await expect(counter.locator('[data-paper-digit]')).toHaveCount(4);
    await expect(scoreboard.getByText('7D', { exact: true })).toBeVisible();
    await expect(scoreboard.getByText('1Y', { exact: true })).toBeVisible();

    await expect
      .poll(
        () =>
          scoreboard.locator('[data-activity-digit]').evaluateAll(digits =>
            digits.every(digit => {
              const face = digit.querySelector<HTMLElement>(
                '[aria-hidden="true"]'
              );
              const paperDigit =
                digit.querySelector<HTMLElement>('[data-paper-digit]');
              if (!face || !paperDigit) return false;
              const faceStyle = getComputedStyle(face);
              return (
                faceStyle.backgroundImage !== 'none' &&
                faceStyle.borderStyle === 'solid' &&
                getComputedStyle(paperDigit).transformStyle === 'preserve-3d'
              );
            })
          ),
        { timeout: 10_000 }
      )
      .toBe(true);

    const overflow = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);

    const minimumHeight = study.height <= 780 ? 232 : 248;
    await expect
      .poll(
        () =>
          scoreboard.evaluate(
            (element, constraints) => {
              const rect = element.getBoundingClientRect();
              return {
                heightReady: rect.height >= constraints.minimumHeight,
                widthContained:
                  rect.width > 0 && rect.width <= constraints.viewportWidth,
              };
            },
            { minimumHeight, viewportWidth: study.width }
          ),
        { timeout: 10_000 }
      )
      .toEqual({ heightReady: true, widthContained: true });

    const screenshotPath = path.join(
      'test-results',
      'scoreboard-appearance',
      study.theme,
      testInfo.project.name,
      `${study.width}x${study.height}.png`
    );
    await mkdir(path.dirname(screenshotPath), { recursive: true });
    await page.screenshot({ path: screenshotPath, animations: 'disabled' });
  });
}

test('captures the live paper counter choreography', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Motion frames are captured once in Chromium.'
  );

  await page.setViewportSize({ width: 1280, height: 720 });
  await page.addInitScript(() => {
    const actualNow = Date.now.bind(Date);
    Date.now = () => actualNow() + 60 * 60 * 1_000;
    window.localStorage.setItem('theme', 'light');
  });

  let releaseResponse!: () => void;
  const responseGate = new Promise<void>(resolve => {
    releaseResponse = resolve;
  });
  let targetToday = 0;

  await page.route('**/api/github-activity', async route => {
    await responseGate;
    const generatedAt = new Date();
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        source: 'public-profile',
        today: targetToday,
        weekTotal: 321,
        yearTotal: 4_321,
        days: activityDays(targetToday, generatedAt),
        generatedAt: generatedAt.toISOString(),
      }),
    });
  });

  const refreshRequest = page.waitForRequest(
    request => new URL(request.url()).pathname === '/api/github-activity'
  );
  const response = await page.goto('/');
  expect(response?.ok()).toBe(true);

  const scoreboard = hydratedScoreboard(page);
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
    testInfo.project.name
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
  await expect(lastDigitFaces).toHaveCount(3, { timeout: 3_000 });
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

  await expect(scoreboard).toHaveAttribute(
    'data-activity-score-value',
    String(targetToday)
  );
  await expect(counter).toHaveAttribute(
    'aria-label',
    new RegExp(`^${targetToday} contributions on Today · `)
  );
  await expect(lastDigitFaces).toHaveCount(1, { timeout: 5_000 });
  await scoreboard.screenshot({
    path: path.join(frameDirectory, '04-settled.png'),
    animations: 'allow',
  });
});

test('queues a newer activity value while paper leaves are still turning', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.addInitScript(() => {
    const actualNow = Date.now.bind(Date);
    let offset = 60 * 60 * 1_000;
    Date.now = () => actualNow() + offset;
    window.__advanceActivityClock = milliseconds => {
      offset += milliseconds;
    };
  });

  let releaseFirst!: () => void;
  let releaseSecond!: () => void;
  const gates = [
    new Promise<void>(resolve => {
      releaseFirst = resolve;
    }),
    new Promise<void>(resolve => {
      releaseSecond = resolve;
    }),
  ];
  let requestIndex = 0;
  let targets = [0, 0];

  await page.route('**/api/github-activity', async route => {
    const index = Math.min(requestIndex, 1);
    requestIndex += 1;
    await gates[index];
    const generatedAt = new Date(Date.now() + index * 1_000);
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        source: 'public-profile',
        today: targets[index],
        weekTotal: 654,
        yearTotal: 7_654,
        days: activityDays(targets[index], generatedAt),
        generatedAt: generatedAt.toISOString(),
      }),
    });
  });

  const firstRequest = page.waitForRequest(
    request => new URL(request.url()).pathname === '/api/github-activity'
  );
  const response = await page.goto('/');
  expect(response?.ok()).toBe(true);

  const counter = hydratedScoreboard(page).locator('[data-paper-counter]');
  await expect(counter).toBeVisible({ timeout: 15_000 });
  await firstRequest;

  const initialLabel = await counter.getAttribute('aria-label');
  const initialToday = Number(initialLabel?.match(/^\d+/)?.[0] ?? 0);
  targets = [shiftedDigits(initialToday, 4), shiftedDigits(initialToday, 7)];
  releaseFirst();

  const scoreboard = hydratedScoreboard(page);
  await expect(scoreboard).toHaveAttribute(
    'data-activity-score-value',
    String(targets[0])
  );
  await expect(counter).toHaveAttribute(
    'aria-label',
    new RegExp(`^${targets[0]} contributions on Today · `)
  );
  const lastDigitFaces = counter
    .locator('[data-paper-digit]')
    .last()
    .locator('[aria-hidden="true"]');
  await expect(lastDigitFaces).toHaveCount(3, { timeout: 3_000 });

  const secondRequest = page.waitForRequest(
    request => new URL(request.url()).pathname === '/api/github-activity'
  );
  await page.evaluate(() => {
    window.__advanceActivityClock(31_000);
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await secondRequest;
  releaseSecond();

  await expect(scoreboard).toHaveAttribute(
    'data-activity-score-value',
    String(targets[1])
  );
  await expect(counter).toHaveAttribute(
    'aria-label',
    new RegExp(`^${targets[1]} contributions on Today · `)
  );
  await expect(
    counter.locator('[data-paper-digit] [aria-hidden="true"]')
  ).toHaveCount(4, {
    timeout: 15_000,
  });
});

test('keeps the paper counter calm with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    window.localStorage.setItem('theme', 'system');
  });
  await page.goto('/');

  const scoreboard = hydratedScoreboard(page);
  const counter = scoreboard.locator('[data-paper-counter]');
  const digit = scoreboard.locator('[data-activity-digit]').first();
  await expect(digit).toBeVisible({ timeout: 15_000 });
  await expect(counter).toHaveAttribute('data-reduced-motion', 'true');
  const before = await scoreboard.evaluate(
    element => getComputedStyle(element).transform
  );
  await scoreboard.hover();
  const after = await scoreboard.evaluate(
    element => getComputedStyle(element).transform
  );

  expect(after).toBe(before);
});

test('keeps paper digits readable in forced colours', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium',
    'Forced-colour emulation is checked in Chromium.'
  );

  await page.emulateMedia({ forcedColors: 'active' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const digit = hydratedScoreboard(page)
    .locator('[data-activity-digit]')
    .first();
  await expect(digit).toBeVisible({ timeout: 15_000 });
  const style = await digit.evaluate(element => {
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
