import { expect, test, type Page } from '@playwright/test';

async function waitForHydratedHomepage(page: Page) {
  await expect(page.locator('[data-site-nav-ready="true"]')).toBeVisible({ timeout: 15_000 });
  const dashboard = page.locator('[data-home-activity-dashboard]:visible').last();
  await expect(dashboard).toBeVisible({ timeout: 15_000 });
  await expect(dashboard.locator('[data-contribution-week-grid]')).toBeVisible();
  return dashboard;
}

test('homepage keeps the requested 28-day activity window', async ({ page }) => {
  await page.goto('/');
  const dashboard = await waitForHydratedHomepage(page);

  await expect(dashboard.getByText('28 days · UTC', { exact: true })).toBeVisible();
  await expect(dashboard.locator('[data-contribution-date]')).toHaveCount(28);
  await expect(dashboard.locator('[data-contribution-week-grid]')).toHaveAttribute(
    'aria-label',
    'GitHub contribution calendar for the last 28 days',
  );
});

test('Scraplet uses the purple paper palette in light mode', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('theme', 'light'));
  await page.goto('/time');

  const scraplet = page.locator('[data-paper-creature]').first();
  await expect(scraplet).toBeVisible({ timeout: 15_000 });
  const bodyFill = await scraplet.locator('svg > path').nth(1).evaluate((element) =>
    getComputedStyle(element).fill,
  );
  const headFill = await scraplet.locator('svg > path').nth(2).evaluate((element) =>
    getComputedStyle(element).fill,
  );

  expect(bodyFill).toBe('rgb(206, 196, 214)');
  expect(headFill).toBe('rgb(228, 220, 233)');
});

test('homepage has no one-pixel nav overflow and Atlas does not shift the layout', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await waitForHydratedHomepage(page);

  const nav = page.locator('[data-site-nav]');
  const trigger = page.locator('[data-site-atlas-trigger]');
  await expect(nav).toBeVisible();
  await expect(trigger).toBeVisible();

  const before = await page.evaluate(() => {
    const navElement = document.querySelector<HTMLElement>('[data-site-nav]');
    const triggerElement = document.querySelector<HTMLElement>('[data-site-atlas-trigger]');
    if (!navElement || !triggerElement) throw new Error('Missing navigation geometry');
    const navRect = navElement.getBoundingClientRect();
    const triggerRect = triggerElement.getBoundingClientRect();
    return {
      nav: { x: navRect.x, y: navRect.y, width: navRect.width, height: navRect.height },
      trigger: { x: triggerRect.x, y: triggerRect.y, width: triggerRect.width },
      clientWidth: document.documentElement.clientWidth,
      scrollHeight: document.documentElement.scrollHeight,
      viewportHeight: window.innerHeight,
    };
  });

  expect(before.nav.height).toBe(48);
  expect(before.scrollHeight).toBeLessThanOrEqual(before.viewportHeight);

  await trigger.click();
  await expect(page.locator('[data-site-atlas]')).toBeVisible();

  const after = await page.evaluate(() => {
    const navElement = document.querySelector<HTMLElement>('[data-site-nav]');
    const triggerElement = document.querySelector<HTMLElement>('[data-site-atlas-trigger]');
    if (!navElement || !triggerElement) throw new Error('Missing navigation geometry');
    const navRect = navElement.getBoundingClientRect();
    const triggerRect = triggerElement.getBoundingClientRect();
    const bodyStyle = getComputedStyle(document.body);
    return {
      nav: { x: navRect.x, y: navRect.y, width: navRect.width, height: navRect.height },
      trigger: { x: triggerRect.x, y: triggerRect.y, width: triggerRect.width },
      clientWidth: document.documentElement.clientWidth,
      bodyMarginRight: bodyStyle.marginRight,
      bodyPaddingRight: bodyStyle.paddingRight,
      removedScrollbarSize: bodyStyle.getPropertyValue('--removed-body-scroll-bar-size').trim(),
    };
  });

  expect(after.clientWidth).toBe(before.clientWidth);
  expect(Math.abs(after.nav.x - before.nav.x)).toBeLessThan(1);
  expect(Math.abs(after.nav.width - before.nav.width)).toBeLessThan(1);
  expect(Math.abs(after.trigger.x - before.trigger.x)).toBeLessThan(1);
  expect(after.bodyMarginRight).toBe('0px');
  expect(after.bodyPaddingRight).toBe('0px');
  expect(after.removedScrollbarSize).toBe('0px');
});

test('timezone search recognises common city names', async ({ page }) => {
  await page.goto('/time');
  await page.getByRole('button', { name: 'Search time zones' }).click();

  const input = page.getByRole('combobox', { name: 'Search time zones' });
  await expect(input).toBeFocused();

  await input.fill('New York');
  await expect(page.getByText('Eastern Time', { exact: true })).toBeVisible();
  await expect(page.getByText('Pacific Time', { exact: true })).toHaveCount(0);

  await input.fill('Los Angeles');
  await expect(page.getByText('Pacific Time', { exact: true })).toBeVisible();
  await expect(page.getByText('Eastern Time', { exact: true })).toHaveCount(0);
});
