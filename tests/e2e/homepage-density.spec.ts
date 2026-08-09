import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const desktopViewports = [
  { width: 1280, height: 720 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1536, height: 864 },
  { width: 1180, height: 720 },
] as const;

async function readHomepageFootprint(page: Page) {
  return page.evaluate(() => {
    const dashboard = document.querySelector<HTMLElement>(
      '[data-home-activity-dashboard]'
    );
    const scoreboard = document.querySelector<HTMLElement>(
      '[data-activity-scoreboard]'
    );
    const activityGrid = document.querySelector<HTMLElement>(
      '[data-home-activity-grid]'
    );
    const activityCell = document.querySelector<HTMLElement>(
      '[data-contribution-week-grid] button'
    );
    const pet = document.querySelector<HTMLElement>('[data-scrapbook-pet]');
    const recentSection = document.querySelector<HTMLElement>(
      '[data-recent-systems]'
    );
    const recentCard = recentSection?.querySelector<HTMLElement>('a');

    if (
      !dashboard ||
      !scoreboard ||
      !activityGrid ||
      !activityCell ||
      !pet ||
      !recentSection ||
      !recentCard
    ) {
      throw new Error('Missing homepage density instrument');
    }

    const rect = (element: HTMLElement) => {
      const box = element.getBoundingClientRect();
      return {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
        right: box.right,
        bottom: box.bottom,
      };
    };

    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      document: {
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight,
      },
      dashboard: rect(dashboard),
      scoreboard: rect(scoreboard),
      activityGrid: rect(activityGrid),
      activityCell: rect(activityCell),
      pet: rect(pet),
      recentSection: rect(recentSection),
      recentCard: rect(recentCard),
    };
  });
}

async function removeDevelopmentChrome(page: Page) {
  await page.evaluate(() => {
    document
      .querySelectorAll('nextjs-portal')
      .forEach(portal => portal.remove());
  });
}

for (const viewport of desktopViewports) {
  test(`keeps the homepage field desk bounded at ${viewport.width}x${viewport.height}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    const response = await page.goto('/');
    expect(response?.ok()).toBe(true);

    await expect(page.locator('[data-wind-scoreboard]')).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator('[data-contribution-week-grid]')).toBeVisible();
    await expect(page.locator('[data-scrapbook-pet]')).toBeVisible();
    await expect(page.locator('[data-recent-systems]')).toBeVisible();

    const footprint = await readHomepageFootprint(page);
    expect(footprint.document.width).toBeLessThanOrEqual(
      footprint.viewport.width
    );
    expect(footprint.document.height).toBeGreaterThanOrEqual(
      footprint.viewport.height
    );
    expect(footprint.pet.bottom).toBeLessThanOrEqual(
      footprint.scoreboard.bottom
    );
    expect(footprint.recentSection.y).toBeGreaterThanOrEqual(
      footprint.dashboard.bottom
    );
    expect(footprint.recentCard.y).toBeGreaterThanOrEqual(
      footprint.recentSection.y
    );
    expect(footprint.activityCell.width).toBeGreaterThanOrEqual(36);
    expect(footprint.activityCell.width).toBeLessThanOrEqual(72);
    expect(footprint.activityCell.height).toBeGreaterThanOrEqual(34);
    expect(footprint.activityCell.height).toBeLessThanOrEqual(72);

    await removeDevelopmentChrome(page);
    const screenshotPath = path.join(
      'test-results',
      'homepage-density',
      'after',
      testInfo.project.name,
      `${viewport.width}x${viewport.height}.png`
    );
    await mkdir(path.dirname(screenshotPath), { recursive: true });
    await page.screenshot({ path: screenshotPath, animations: 'disabled' });
  });
}

test('moves through the desktop layout transition without inflating the activity cells', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1000, height: 720 });
  const response = await page.goto('/');
  expect(response?.ok()).toBe(true);
  await expect(page.locator('[data-home-activity-dashboard]')).toBeVisible({
    timeout: 15_000,
  });

  const stacked = await readHomepageFootprint(page);
  expect(Math.abs(stacked.scoreboard.x - stacked.activityGrid.x)).toBeLessThan(
    2
  );
  expect(stacked.activityGrid.y).toBeGreaterThan(stacked.scoreboard.bottom);

  await page.setViewportSize({ width: 1040, height: 720 });
  const sideBySide = await readHomepageFootprint(page);
  expect(sideBySide.activityGrid.x).toBeGreaterThan(
    sideBySide.scoreboard.right
  );
  expect(
    Math.abs(sideBySide.scoreboard.y - sideBySide.activityGrid.y)
  ).toBeLessThan(2);
  expect(
    Math.abs(stacked.activityCell.width - sideBySide.activityCell.width)
  ).toBeLessThanOrEqual(8);
  expect(sideBySide.document.width).toBeLessThanOrEqual(
    sideBySide.viewport.width
  );
});

test('keeps the scorecard planted and lets the visitor pet Scraplet', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  const response = await page.goto('/');
  expect(response?.ok()).toBe(true);

  const scoreboard = page.locator('[data-activity-scoreboard]');
  const pet = page.locator('[data-scrapbook-pet]');

  await expect(scoreboard).toBeVisible({ timeout: 15_000 });
  await expect(pet).toHaveAttribute('data-pets', '0');
  await expect(pet.locator('[data-paper-creature-tail]')).toHaveCount(1);
  await expect(pet.locator('[data-paper-creature-tail-fold]')).toHaveCount(1);
  await expect(
    pet.locator('[data-paper-creature-back-plates] path')
  ).toHaveCount(2);

  const scoreboardBefore = await scoreboard.boundingBox();
  expect(scoreboardBefore).not.toBeNull();
  await scoreboard.hover();
  await page.waitForTimeout(300);
  const scoreboardAfter = await scoreboard.boundingBox();
  expect(scoreboardAfter).not.toBeNull();
  expect(Math.abs(scoreboardAfter!.x - scoreboardBefore!.x)).toBeLessThan(1);
  expect(Math.abs(scoreboardAfter!.y - scoreboardBefore!.y)).toBeLessThan(1);
  expect(
    await scoreboard.evaluate(element => getComputedStyle(element).filter)
  ).toBe('none');

  await pet.click();
  await expect(pet).toHaveAttribute('data-pets', '1');
});
