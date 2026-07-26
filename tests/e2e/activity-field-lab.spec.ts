import { expect, test, type Page } from '@playwright/test';

const route = '/activity-lab';
const chronologicalDates = Array.from({ length: 28 }, (_, index) => {
  const date = new Date(Date.UTC(2026, 5, 30 + index));
  return date.toISOString().slice(0, 10);
});

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
  }));

  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
}

test('keeps chronological DOM order in every visual candidate', async ({ page }) => {
  await page.goto(route);

  for (const layout of ['square', 'honeycomb', 'pyramid']) {
    const dates = await page
      .locator(`[data-activity-field][data-layout="${layout}"] [data-activity-day]`)
      .evaluateAll((elements) =>
        elements.map((element) => (element as HTMLElement).dataset.date ?? ''),
      );
    expect(dates).toEqual(chronologicalDates);
  }
});

test('places today at the honeycomb origin while retaining the square control', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(route);

  const honeycomb = page.locator('[data-activity-field][data-layout="honeycomb"]');
  const honeycombToday = await honeycomb.locator('[data-today="true"]').boundingBox();
  const honeycombBoxes = await honeycomb.locator('[data-activity-day]').evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { x: rect.x, y: rect.y };
    }),
  );
  expect(honeycombToday).toBeTruthy();
  expect(honeycombToday!.y).toBeCloseTo(Math.min(...honeycombBoxes.map((box) => box.y)), 0);
  const honeycombTopRow = honeycombBoxes.filter(
    (box) => Math.abs(box.y - honeycombToday!.y) < 2,
  );
  expect(honeycombToday!.x).toBeCloseTo(Math.min(...honeycombTopRow.map((box) => box.x)), 0);

  const square = page.locator('[data-activity-field][data-layout="square"]');
  const squareToday = await square.locator('[data-today="true"]').boundingBox();
  const squareBoxes = await square.locator('[data-activity-day]').evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { x: rect.x, y: rect.y };
    }),
  );
  expect(squareToday).toBeTruthy();
  expect(squareToday!.y).toBeCloseTo(Math.max(...squareBoxes.map((box) => box.y)), 0);
  const squareBottomRow = squareBoxes.filter((box) => Math.abs(box.y - squareToday!.y) < 2);
  expect(squareToday!.x).toBeCloseTo(Math.max(...squareBottomRow.map((box) => box.x)), 0);
});

test('keeps today, selected day, and keyboard focus independent', async ({ page }) => {
  await page.goto(route);

  const honeycombButtons = page.locator(
    '[data-activity-field][data-layout="honeycomb"] [data-activity-day]',
  );
  const selectedDay = honeycombButtons.nth(26);
  await selectedDay.click();

  const today = honeycombButtons.nth(27);
  await expect(selectedDay).toHaveAttribute('aria-pressed', 'true');
  await expect(today).toHaveAttribute('data-today', 'true');
  await expect(today).toHaveAttribute('aria-pressed', 'false');

  await selectedDay.focus();
  await page.keyboard.press('ArrowLeft');
  const focusedDate = await page.evaluate(
    () => (document.activeElement as HTMLElement | null)?.dataset.date,
  );
  expect(focusedDate).toBe(chronologicalDates[25]);
  await expect(honeycombButtons.nth(25)).toHaveAttribute('aria-pressed', 'false');
  await expect(honeycombButtons.nth(25)).toHaveAttribute('data-today', null);

  await page.keyboard.press('Enter');
  await expect(honeycombButtons.nth(25)).toHaveAttribute('aria-pressed', 'true');
  await expect(
    page.locator('[data-activity-field][data-layout="square"] [data-activity-day]').nth(25),
  ).toHaveAttribute('aria-pressed', 'true');
});

test('preserves 44px touch targets and natural mobile overflow behaviour', async ({ page }) => {
  for (const viewport of [
    { width: 360, height: 780 },
    { width: 740, height: 360 },
    { width: 820, height: 1180 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto(route);
    await expectNoHorizontalOverflow(page);

    const smallestTarget = await page.locator('[data-activity-day]').evaluateAll((elements) =>
      Math.min(
        ...elements.flatMap((element) => {
          const rect = element.getBoundingClientRect();
          return [rect.width, rect.height];
        }),
      ),
    );
    expect(smallestTarget).toBeGreaterThanOrEqual(44);
  }
});

test('captures stable comparison screenshots', async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== 'chromium');
  await page.emulateMedia({ reducedMotion: 'reduce' });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(route);
  await page.screenshot({
    path: testInfo.outputPath('activity-field-desktop.png'),
    fullPage: true,
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route);
  await page.screenshot({
    path: testInfo.outputPath('activity-field-mobile.png'),
    fullPage: true,
  });
});
