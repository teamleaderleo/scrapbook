import { expect, test, type Page } from '@playwright/test';

async function waitForHydratedHomepage(page: Page) {
  await expect(page.locator('[data-site-nav-ready="true"]')).toBeVisible({
    timeout: 15_000,
  });
  const tools = page.locator('[data-home-tools]');
  await expect(tools).toBeVisible();
  return tools;
}

test('Time Machine uses the intended monospaced controls', async ({ page }) => {
  await page.goto('/time');

  const heading = page.getByRole('heading', { name: 'Current time', level: 1 });
  const trigger = page.locator('[data-timezone-trigger]');
  await expect(heading).toBeVisible({ timeout: 15_000 });
  await expect(heading).toHaveClass(/font-mono/);
  await expect(trigger).toBeVisible();

  const triggerStyle = await trigger.evaluate(element => {
    const style = getComputedStyle(element);
    return {
      fontFamily: style.fontFamily,
      height: element.getBoundingClientRect().height,
    };
  });
  expect(triggerStyle.fontFamily.toLowerCase()).toContain('mono');
  expect(triggerStyle.height).toBeGreaterThanOrEqual(48);
});

test('homepage has no one-pixel nav overflow and Atlas does not shift the layout', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await waitForHydratedHomepage(page);

  const nav = page.locator('[data-site-nav]');
  const trigger = page.locator('[data-site-atlas-trigger]');
  await expect(nav).toBeVisible();
  await expect(trigger).toBeVisible();

  const before = await page.evaluate(() => {
    const navElement = document.querySelector<HTMLElement>('[data-site-nav]');
    const triggerElement = document.querySelector<HTMLElement>(
      '[data-site-atlas-trigger]'
    );
    if (!navElement || !triggerElement)
      throw new Error('Missing navigation geometry');
    const navRect = navElement.getBoundingClientRect();
    const triggerRect = triggerElement.getBoundingClientRect();
    return {
      nav: {
        x: navRect.x,
        y: navRect.y,
        width: navRect.width,
        height: navRect.height,
      },
      trigger: { x: triggerRect.x, y: triggerRect.y, width: triggerRect.width },
      clientWidth: document.documentElement.clientWidth,
      scrollY: window.scrollY,
      scrollHeight: document.documentElement.scrollHeight,
      viewportHeight: window.innerHeight,
    };
  });

  expect(before.nav.height).toBe(48);
  expect(before.scrollHeight).toBeGreaterThanOrEqual(before.viewportHeight);

  await trigger.click();
  await expect(page.locator('[data-site-atlas]')).toBeVisible();

  const after = await page.evaluate(() => {
    const navElement = document.querySelector<HTMLElement>('[data-site-nav]');
    const triggerElement = document.querySelector<HTMLElement>(
      '[data-site-atlas-trigger]'
    );
    if (!navElement || !triggerElement)
      throw new Error('Missing navigation geometry');
    const navRect = navElement.getBoundingClientRect();
    const triggerRect = triggerElement.getBoundingClientRect();
    const bodyStyle = getComputedStyle(document.body);
    return {
      nav: {
        x: navRect.x,
        y: navRect.y,
        width: navRect.width,
        height: navRect.height,
      },
      trigger: { x: triggerRect.x, y: triggerRect.y, width: triggerRect.width },
      clientWidth: document.documentElement.clientWidth,
      scrollY: window.scrollY,
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      bodyMarginRight: bodyStyle.marginRight,
      bodyPaddingRight: bodyStyle.paddingRight,
      removedScrollbarSize: bodyStyle
        .getPropertyValue('--removed-body-scroll-bar-size')
        .trim(),
    };
  });

  expect(after.clientWidth).toBeGreaterThanOrEqual(before.clientWidth);
  expect(after.scrollWidth).toBeLessThanOrEqual(after.viewportWidth + 1);
  expect(after.scrollY).toBe(before.scrollY);
  expect(Math.abs(after.nav.x - before.nav.x)).toBeLessThan(1);
  expect(Math.abs(after.nav.width - before.nav.width)).toBeLessThan(1);
  expect(Math.abs(after.trigger.x - before.trigger.x)).toBeLessThan(1);
  expect(after.bodyMarginRight).toBe('0px');
  expect(Number.parseFloat(after.bodyPaddingRight)).toBeGreaterThanOrEqual(0);
  expect(after.bodyPaddingRight).toBe(after.removedScrollbarSize);
});

test('navigation fills a phone rail and exposes room links when they fit', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await waitForHydratedHomepage(page);

  const phone = await page.evaluate(() => {
    const selectors = [
      '[data-site-home]',
      '[data-site-time]',
      'button[aria-label="Search Scrapbook"]',
      '[data-theme-toggle]',
      '[data-site-atlas-trigger]',
    ];
    return selectors.map(selector => {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) throw new Error(`Missing ${selector}`);
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right, width: rect.width };
    });
  });

  expect(phone[0]!.left).toBeLessThanOrEqual(1);
  for (let index = 1; index < phone.length; index += 1) {
    expect(Math.abs(phone[index]!.left - phone[index - 1]!.right)).toBeLessThan(
      1
    );
  }
  expect(phone.at(-1)!.right).toBeGreaterThanOrEqual(389);

  await page.setViewportSize({ width: 740, height: 844 });
  const roomLinks = page.locator('[data-site-primary-link]');
  await expect(roomLinks).toHaveCount(4);
  for (const link of await roomLinks.all()) {
    await expect(link).toBeVisible();
    const box = await link.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.height).toBe(48);
    expect(box!.width).toBeGreaterThanOrEqual(72);
  }
});

test('timezone search recognises common city names', async ({ page }) => {
  await page.goto('/time');
  await page.locator('[data-timezone-trigger]').click();

  const picker = page.locator('[data-timezone-picker]');
  const results = picker.locator('[data-timezone-results]');
  const input = picker.locator('input');
  await expect(picker).toBeVisible();
  await expect(input).toBeVisible();

  await input.fill('New York');
  await expect(
    results.getByText('Eastern Time', { exact: true })
  ).toBeVisible();
  await expect(results.getByText('Pacific Time', { exact: true })).toHaveCount(
    0
  );

  await input.fill('Los Angeles');
  await expect(
    results.getByText('Pacific Time', { exact: true })
  ).toBeVisible();
  await expect(results.getByText('Eastern Time', { exact: true })).toHaveCount(
    0
  );
});
