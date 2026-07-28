import { expect, test, type Page } from '@playwright/test';

async function waitForHomeActivity(page: Page) {
  await expect(page.locator('[data-home-activity-dashboard]')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('[data-contribution-week-grid]')).toBeVisible();
}

test('time page uses one display typeface for the current-time heading and value', async ({ page }) => {
  await page.goto('/time');

  const heading = page.getByRole('heading', { name: 'Current time' });
  const value = page.getByTitle('Jump the slider to the current time');
  await expect(heading).toBeVisible();
  await expect(value).toBeVisible();

  const fonts = await page.evaluate(() => {
    const headingElement = [...document.querySelectorAll('h1')].find(
      (element) => element.textContent?.trim() === 'Current time',
    );
    const valueElement = document.querySelector<HTMLElement>(
      '[title="Jump the slider to the current time"]',
    );
    if (!headingElement || !valueElement) throw new Error('Missing current-time typography');

    return {
      heading: getComputedStyle(headingElement).fontFamily,
      value: getComputedStyle(valueElement).fontFamily,
    };
  });

  expect(fonts.heading).toBe(fonts.value);
});

test('homepage shows 28 contribution days without a stray viewport scrollbar', async ({ page }) => {
  for (const viewport of [
    { width: 1366, height: 768 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await waitForHomeActivity(page);

    await expect(page.getByText('28 days · UTC', { exact: true })).toBeVisible();
    await expect(page.locator('[data-contribution-week-grid] button')).toHaveCount(28);

    const metrics = await page.evaluate(() => {
      const nav = document.querySelector('nav');
      if (!nav) throw new Error('Missing site navigation');
      return {
        navHeight: nav.getBoundingClientRect().height,
        documentHeight: document.documentElement.scrollHeight,
        viewportHeight: document.documentElement.clientHeight,
      };
    });

    expect(metrics.navHeight).toBe(48);
    expect(metrics.documentHeight).toBeLessThanOrEqual(metrics.viewportHeight + 1);
  }
});

test('Scraplet keeps the original purple paper palette', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('theme', 'light'));
  await page.goto('/');
  await waitForHomeActivity(page);

  const fills = await page.locator('[data-scrapbook-pet] [data-paper-creature] svg').evaluate((svg) => {
    const paths = svg.querySelectorAll('path');
    return {
      tail: getComputedStyle(paths[0]).fill,
      body: getComputedStyle(paths[1]).fill,
      head: getComputedStyle(paths[2]).fill,
    };
  });

  expect(fills).toEqual({
    tail: 'rgb(183, 173, 191)',
    body: 'rgb(206, 196, 214)',
    head: 'rgb(228, 220, 233)',
  });
});

test('opening the Atlas does not shift the page when scroll locking', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 760 });
  await page.goto('/journal');

  const trigger = page.locator('[data-site-atlas-trigger]');
  await expect(trigger).toBeVisible();

  const before = await page.evaluate(() => {
    const triggerElement = document.querySelector<HTMLElement>('[data-site-atlas-trigger]');
    const nav = document.querySelector<HTMLElement>('nav');
    if (!triggerElement || !nav) throw new Error('Missing Atlas layout instruments');
    return {
      triggerRight: triggerElement.getBoundingClientRect().right,
      navLeft: nav.getBoundingClientRect().left,
      navWidth: nav.getBoundingClientRect().width,
    };
  });

  await trigger.click();
  await expect(page.locator('[data-site-atlas]')).toBeVisible();

  const after = await page.evaluate(() => {
    const triggerElement = document.querySelector<HTMLElement>('[data-site-atlas-trigger]');
    const nav = document.querySelector<HTMLElement>('nav');
    if (!triggerElement || !nav) throw new Error('Missing Atlas layout instruments');
    return {
      triggerRight: triggerElement.getBoundingClientRect().right,
      navLeft: nav.getBoundingClientRect().left,
      navWidth: nav.getBoundingClientRect().width,
      compensation: getComputedStyle(document.body)
        .getPropertyValue('--removed-body-scroll-bar-size')
        .trim(),
    };
  });

  expect(Math.abs(after.triggerRight - before.triggerRight)).toBeLessThan(1);
  expect(Math.abs(after.navLeft - before.navLeft)).toBeLessThan(1);
  expect(Math.abs(after.navWidth - before.navWidth)).toBeLessThan(1);
  expect(after.compensation).toBe('0px');
});
