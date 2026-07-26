import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const route = '/';

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
  }));

  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
}

async function activityField(page: Page) {
  const field = page.locator('[data-home-activity-field]');
  await expect(field).toHaveAttribute('data-interactive', 'true');
  return field;
}

async function activityDates(page: Page) {
  return page.locator('[data-home-activity-field] [data-activity-day]').evaluateAll((elements) =>
    elements.map((element) => (element as HTMLElement).dataset.date ?? ''),
  );
}

test('keeps chronological DOM order while placing today at the visual origin', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  const response = await page.goto(route);
  expect(response?.ok()).toBe(true);

  const field = await activityField(page);
  await expect(field).toHaveAttribute('data-layout', 'honeycomb');

  const dates = await activityDates(page);
  expect(dates).toHaveLength(28);
  expect(dates).toEqual([...dates].sort());

  const today = field.locator('[data-today="true"]');
  await expect(today).toHaveCount(1);
  await expect(today).toHaveAttribute('data-date', dates.at(-1)!);

  const todayBox = await today.boundingBox();
  const boxes = await field.locator('[data-activity-day]').evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { x: rect.x, y: rect.y };
    }),
  );
  expect(todayBox).toBeTruthy();
  expect(todayBox!.y).toBeCloseTo(Math.min(...boxes.map((box) => box.y)), 0);
  const topRow = boxes.filter((box) => Math.abs(box.y - todayBox!.y) < 2);
  expect(todayBox!.x).toBeCloseTo(Math.min(...topRow.map((box) => box.x)), 0);
});

test('keeps today, selection, keyboard focus, hover, and zero-count marks independent', async ({
  page,
}) => {
  await page.goto(route);

  const field = await activityField(page);
  const buttons = field.locator('[data-activity-day]');
  await expect(buttons).toHaveCount(28);

  const selected = buttons.nth(26);
  const today = buttons.nth(27);
  await selected.click();

  await expect(selected).toHaveAttribute('aria-pressed', 'true');
  await expect(today).toHaveAttribute('data-today', 'true');
  await expect(today).toHaveAttribute('aria-pressed', 'false');

  await buttons.nth(25).focus();
  await page.keyboard.press('ArrowLeft');
  const focusedDate = await page.evaluate(
    () => (document.activeElement as HTMLElement | null)?.dataset.date,
  );
  await expect(buttons.nth(24)).toHaveAttribute('data-date', focusedDate!);
  await expect(buttons.nth(24)).toHaveAttribute('aria-pressed', 'false');
  await expect(buttons.nth(24)).not.toHaveAttribute('data-today', 'true');

  await page.keyboard.press('Enter');
  await expect(buttons.nth(24)).toHaveAttribute('aria-pressed', 'true');
  await expect(today).toHaveAttribute('data-today', 'true');

  await buttons.nth(5).hover();
  await expect(buttons.nth(24)).toHaveAttribute('aria-pressed', 'true');

  const zeroCount = buttons.filter({ has: page.locator('span.h-1.w-1') }).first();
  await expect(zeroCount).toBeVisible();
  await expect(page.locator('[data-selected-readout]')).toBeVisible();
});

test('preserves 44px targets and natural overflow across compact viewports', async ({ page }) => {
  for (const viewport of [
    { width: 360, height: 780 },
    { width: 390, height: 844 },
    { width: 740, height: 360 },
    { width: 820, height: 720 },
    { width: 860, height: 720 },
  ]) {
    await page.setViewportSize(viewport);
    const response = await page.goto(route);
    expect(response?.ok()).toBe(true);
    const field = await activityField(page);
    await expectNoHorizontalOverflow(page);

    const smallestTarget = await field.locator('[data-activity-day]').evaluateAll((elements) =>
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

test('keeps selection and geometry stable when live activity refreshes', async ({ page }) => {
  await page.addInitScript(() => {
    Date.now = () => Date.parse('2030-01-01T00:00:00.000Z');
  });
  await page.setViewportSize({ width: 1280, height: 720 });
  const response = await page.goto(route);
  expect(response?.ok()).toBe(true);

  const field = await activityField(page);
  const dates = await activityDates(page);
  let refreshes = 0;
  await page.route('**/api/github-activity', async (request) => {
    refreshes += 1;
    await request.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        today: 727,
        weekTotal: 5_068,
        yearTotal: 18_240,
        generatedAt: '2030-01-01T00:00:00.000Z',
        days: dates.map((date, index) => ({ date, count: 700 + index })),
      }),
    });
  });

  const card = page.locator('[data-home-activity-grid]');
  const selected = field.locator('[data-activity-day]').nth(10);
  const selectedDate = await selected.getAttribute('data-date');
  await selected.click();
  await expect(selected).toHaveAttribute('aria-pressed', 'true');

  const beforeCard = await card.boundingBox();
  const beforeField = await field.boundingBox();
  await page.waitForTimeout(3_400);

  expect(refreshes).toBe(1);
  await expect(field.locator(`[data-date="${selectedDate}"]`)).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(field.locator('[data-activity-day]').nth(10)).toHaveAttribute(
    'aria-label',
    /710 contributions/,
  );

  const afterCard = await card.boundingBox();
  const afterField = await field.boundingBox();
  expect(beforeCard).toBeTruthy();
  expect(afterCard).toBeTruthy();
  expect(beforeField).toBeTruthy();
  expect(afterField).toBeTruthy();
  expect(Math.abs(afterCard!.width - beforeCard!.width)).toBeLessThan(1);
  expect(Math.abs(afterCard!.height - beforeCard!.height)).toBeLessThan(1);
  expect(Math.abs(afterField!.width - beforeField!.width)).toBeLessThan(1);
  expect(Math.abs(afterField!.height - beforeField!.height)).toBeLessThan(1);
});

const evidenceStudies = [
  { theme: 'light', width: 390, height: 844 },
  { theme: 'dark', width: 390, height: 844 },
  { theme: 'light', width: 1366, height: 768 },
  { theme: 'dark', width: 1440, height: 900 },
] as const;

for (const study of evidenceStudies) {
  test(`captures ${study.theme} homepage honeycomb evidence at ${study.width}x${study.height}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: study.width, height: study.height });
    await page.addInitScript((theme) => {
      window.localStorage.setItem('theme', theme);
    }, study.theme);

    const response = await page.goto(route);
    expect(response?.ok()).toBe(true);
    await activityField(page);
    await expect(page.locator('[data-material-exemplar="activity-honeycomb"]')).toBeVisible();
    await expectNoHorizontalOverflow(page);

    const screenshotPath = path.join(
      'test-results',
      'homepage-honeycomb',
      study.theme,
      testInfo.project.name,
      `${study.width}x${study.height}.png`,
    );
    await mkdir(path.dirname(screenshotPath), { recursive: true });
    await page.screenshot({ path: screenshotPath, animations: 'disabled' });
  });
}
