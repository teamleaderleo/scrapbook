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
    const dashboard = document.querySelector<HTMLElement>('[data-home-activity-dashboard]');
    const scoreboard = document.querySelector<HTMLElement>('[data-activity-scoreboard]');
    const activityGrid = document.querySelector<HTMLElement>('[data-home-activity-grid]');
    const activityCell = document.querySelector<HTMLElement>(
      '[aria-label="Four weeks of GitHub activity"] button',
    );
    const pet = document.querySelector<HTMLElement>('[data-scrapbook-pet]');
    const recentSection = document.querySelector<HTMLElement>('[data-recent-systems]');
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
    document.querySelectorAll('nextjs-portal').forEach((portal) => portal.remove());
  });
}

for (const viewport of desktopViewports) {
  test(`keeps the homepage instrument compact at ${viewport.width}x${viewport.height}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    const response = await page.goto('/');
    expect(response?.ok()).toBe(true);

    await expect(page.locator('[data-wind-scoreboard]')).toBeVisible();
    await expect(page.locator('[aria-label="Four weeks of GitHub activity"]')).toBeVisible();
    await expect(page.locator('[data-scrapbook-pet]')).toBeVisible();
    await expect(page.getByText('Recent systems', { exact: true })).toBeVisible();

    const footprint = await readHomepageFootprint(page);
    expect(footprint.document.width).toBeLessThanOrEqual(footprint.viewport.width);
    expect(footprint.document.height - footprint.viewport.height).toBeLessThanOrEqual(4);
    expect(footprint.dashboard.bottom).toBeLessThan(footprint.viewport.height);
    expect(footprint.pet.bottom).toBeLessThanOrEqual(footprint.scoreboard.bottom);
    expect(footprint.recentSection.y).toBeLessThan(footprint.viewport.height - 72);
    expect(footprint.recentCard.y).toBeLessThan(footprint.viewport.height - 40);
    expect(footprint.activityCell.width).toBeGreaterThanOrEqual(42);
    expect(footprint.activityCell.width).toBeLessThanOrEqual(56);
    expect(Math.abs(footprint.activityCell.width - footprint.activityCell.height)).toBeLessThan(1);

    await removeDevelopmentChrome(page);
    const screenshotPath = path.join(
      'test-results',
      'homepage-density',
      'after',
      testInfo.project.name,
      `${viewport.width}x${viewport.height}.png`,
    );
    await mkdir(path.dirname(screenshotPath), { recursive: true });
    await page.screenshot({ path: screenshotPath, animations: 'disabled' });
  });
}

test('moves through the desktop layout transition without inflating the activity cells', async ({
  page,
}) => {
  await page.setViewportSize({ width: 820, height: 720 });
  const response = await page.goto('/');
  expect(response?.ok()).toBe(true);
  await expect(page.locator('[data-home-activity-dashboard]')).toBeVisible();

  const stacked = await readHomepageFootprint(page);
  expect(Math.abs(stacked.scoreboard.x - stacked.activityGrid.x)).toBeLessThan(2);
  expect(stacked.activityGrid.y).toBeGreaterThan(stacked.scoreboard.bottom);

  await page.setViewportSize({ width: 860, height: 720 });
  const sideBySide = await readHomepageFootprint(page);
  expect(sideBySide.activityGrid.x).toBeGreaterThan(sideBySide.scoreboard.right);
  expect(Math.abs(sideBySide.scoreboard.y - sideBySide.activityGrid.y)).toBeLessThan(2);
  expect(Math.abs(stacked.activityCell.width - sideBySide.activityCell.width)).toBeLessThan(6);
  expect(sideBySide.document.width).toBeLessThanOrEqual(sideBySide.viewport.width);
});

test('keeps hover surfaces planted and lets the visitor pet Scraplet', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  const response = await page.goto('/');
  expect(response?.ok()).toBe(true);

  const digit = page.locator('[data-activity-digit]').first();
  const recentCard = page.locator('[data-recent-systems] a').first();
  const pet = page.locator('[data-scrapbook-pet]');

  await expect(digit).toBeVisible();
  await expect(recentCard).toBeVisible();
  await expect(pet).toHaveAttribute('data-pets', '0');

  const digitBefore = await digit.boundingBox();
  const cardBefore = await recentCard.boundingBox();
  await digit.hover();
  await recentCard.hover();
  await page.waitForTimeout(300);
  const digitAfter = await digit.boundingBox();
  const cardAfter = await recentCard.boundingBox();

  expect(digitBefore).not.toBeNull();
  expect(digitAfter).not.toBeNull();
  expect(cardBefore).not.toBeNull();
  expect(cardAfter).not.toBeNull();
  expect(Math.abs((digitAfter?.x ?? 0) - (digitBefore?.x ?? 0))).toBeLessThan(1);
  expect(Math.abs((digitAfter?.y ?? 0) - (digitBefore?.y ?? 0))).toBeLessThan(1);
  expect(Math.abs((cardAfter?.x ?? 0) - (cardBefore?.x ?? 0))).toBeLessThan(1);
  expect(Math.abs((cardAfter?.y ?? 0) - (cardBefore?.y ?? 0))).toBeLessThan(1);

  await pet.click();
  await expect(pet).toHaveAttribute('data-pets', '1');
});
