import { expect, test } from '@playwright/test';

test('the contribution calendar previews and locks days on the scoreboard', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  const response = await page.goto('/');
  expect(response?.ok()).toBe(true);

  const dashboard = page
    .locator('[data-home-activity-dashboard]:visible')
    .last();
  const scoreboard = dashboard.locator('[data-activity-scoreboard]');
  const cells = dashboard.locator('[data-contribution-week-grid] button');
  const previewCell = dashboard
    .locator(
      '[data-contribution-week-grid] button:not([data-contribution-selected="true"])'
    )
    .first();

  await expect(scoreboard).toBeVisible({ timeout: 15_000 });
  await expect(cells.first()).toBeVisible();
  await expect(previewCell).toBeVisible();
  await expect(page.locator('[data-home-activity-loading]')).toHaveCount(0);

  const initialDate = await scoreboard.getAttribute('data-activity-score-date');
  const previewDate = await previewCell.getAttribute('data-contribution-date');

  expect(initialDate).toBeTruthy();
  expect(previewDate).toBeTruthy();
  expect(previewDate).not.toBe(initialDate);

  await previewCell.hover();
  await expect(scoreboard).toHaveAttribute(
    'data-activity-score-date',
    previewDate!
  );
  await expect(scoreboard).toContainText(/UTC reset \d{2}:\d{2}:\d{2}/);
  await expect(scoreboard).not.toContainText('UTC total');

  await page.mouse.move(8, 8);
  await expect(scoreboard).toHaveAttribute(
    'data-activity-score-date',
    initialDate!
  );

  await previewCell.click();
  await page.mouse.move(8, 8);
  await expect(scoreboard).toHaveAttribute(
    'data-activity-score-date',
    previewDate!
  );
  const lockedCell = dashboard.locator(
    `[data-contribution-week-grid] button[data-contribution-date="${previewDate}"]`
  );
  await expect(lockedCell).toHaveAttribute('aria-pressed', 'true');
});

test('a background refresh preserves the active preview and locked day', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.addInitScript(() => {
    const actualNow = Date.now.bind(Date);
    Date.now = () => actualNow() + 60 * 60 * 1_000;
  });

  let releaseResponse!: () => void;
  const responseGate = new Promise<void>(resolve => {
    releaseResponse = resolve;
  });
  let refreshedDays: Array<{ date: string; count: number }> = [];

  await page.route('**/api/github-activity', async route => {
    await responseGate;
    const latest = refreshedDays.at(-1);
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        source: 'public-profile',
        today: latest?.count ?? 0,
        weekTotal: refreshedDays
          .slice(-7)
          .reduce((sum, day) => sum + day.count, 0),
        yearTotal: refreshedDays.reduce((sum, day) => sum + day.count, 0),
        days: refreshedDays,
        generatedAt: new Date().toISOString(),
      }),
    });
  });

  const refreshRequest = page.waitForRequest(
    request => new URL(request.url()).pathname === '/api/github-activity'
  );
  const refreshResponse = page.waitForResponse(
    response => new URL(response.url()).pathname === '/api/github-activity'
  );
  const response = await page.goto('/');
  expect(response?.ok()).toBe(true);

  const dashboard = page
    .locator('[data-home-activity-dashboard]:visible')
    .last();
  const scoreboard = dashboard.locator('[data-activity-scoreboard]');
  const recordedCells = dashboard.locator(
    '[data-contribution-week-grid] button'
  );
  await expect(recordedCells.first()).toBeVisible({ timeout: 15_000 });

  refreshedDays = await recordedCells.evaluateAll(cells =>
    cells.map(cell => ({
      date: cell.getAttribute('data-contribution-date') ?? '',
      count: Number(
        cell
          .getAttribute('aria-label')
          ?.match(/· ([\d,]+) contributions$/)?.[1]
          ?.replaceAll(',', '') ?? 0
      ),
    }))
  );

  const lockedCell = recordedCells.nth(1);
  const lockedDate = await lockedCell.getAttribute('data-contribution-date');
  expect(lockedDate).toBeTruthy();
  await lockedCell.click();
  await page.mouse.move(8, 8);
  await expect(scoreboard).toHaveAttribute(
    'data-activity-score-date',
    lockedDate!
  );

  const previewCell = recordedCells.nth(2);
  const previewDate = await previewCell.getAttribute('data-contribution-date');
  expect(previewDate).toBeTruthy();
  expect(previewDate).not.toBe(lockedDate);
  await previewCell.hover();
  await expect(scoreboard).toHaveAttribute(
    'data-activity-score-date',
    previewDate!
  );

  await refreshRequest;
  releaseResponse();
  await refreshResponse;
  await expect(scoreboard).toHaveAttribute(
    'data-activity-score-date',
    previewDate!
  );

  await page.mouse.move(8, 8);
  await expect(scoreboard).toHaveAttribute(
    'data-activity-score-date',
    lockedDate!
  );
  await expect(
    dashboard.locator(
      `[data-contribution-week-grid] button[data-contribution-date="${lockedDate}"]`
    )
  ).toHaveAttribute('aria-pressed', 'true');
});
