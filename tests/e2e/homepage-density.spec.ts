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

  const digitBefore = await digit.evaluate((element) => getComputedStyle(element).transform);
  await digit.hover();
  const digitAfter = await digit.evaluate((element) => getComputedStyle(element).transform);
  expect(digitAfter).toBe(digitBefore);

  const cardBefore = await recentCard.evaluate((element) => getComputedStyle(element).transform);
  await recentCard.hover();
  const cardAfter = await recentCard.evaluate((element) => getComputedStyle(element).transform);
  expect(cardAfter).toBe(cardBefore);

  await pet.click();
  await expect(pet).toHaveAttribute('data-pets', '1');
});

test('keeps the paper grid legible and Scraplet cosy in both themes', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 720 });

  for (const study of [
    { theme: 'light', alpha: 0.036 },
    { theme: 'dark', alpha: 0.044 },
  ] as const) {
    await page.goto('/');
    await page.evaluate((theme) => window.localStorage.setItem('theme', theme), study.theme);
    await page.reload();

    await expect(page.locator('html')).toHaveClass(new RegExp(study.theme));

    const grid = page.locator('[data-home-paper-grid]');
    const pet = page.locator('[data-scrapbook-pet]');
    await expect(grid).toBeVisible();
    await expect(pet).toBeVisible();

    const appearance = await page.evaluate(() => {
      const gridElement = document.querySelector<HTMLElement>('[data-home-paper-grid]');
      const petElement = document.querySelector<HTMLElement>('[data-scrapbook-pet]');
      if (!gridElement || !petElement) throw new Error('Missing paper homepage cue');

      const gridStyle = getComputedStyle(gridElement);
      const petStyle = getComputedStyle(petElement);
      return {
        gridAlpha: Number.parseFloat(gridStyle.getPropertyValue('--home-grid-alpha')),
        gridImage: gridStyle.backgroundImage,
        petImage: petStyle.backgroundImage,
      };
    });

    expect(appearance.gridAlpha).toBeCloseTo(study.alpha, 3);
    expect(appearance.gridImage).not.toBe('none');
    expect(appearance.petImage).not.toBe('none');

    await removeDevelopmentChrome(page);
    const screenshotPath = path.join(
      'test-results',
      'homepage-density',
      'themes',
      testInfo.project.name,
      `${study.theme}-1280x720.png`,
    );
    await mkdir(path.dirname(screenshotPath), { recursive: true });
    await page.screenshot({ path: screenshotPath, animations: 'disabled' });
  }
});
