import { expect, test, type Page } from '@playwright/test';

const publicRoutes = ['/', '/time', '/gallery', '/atelier'];

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
  }));

  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
}

async function waitForClientHydration(page: Page) {
  const timeLink = page.getByRole('link', { name: /Open the time converter/i });
  await expect
    .poll(() => timeLink.getAttribute('aria-label'))
    .not.toContain('Local time --:--');
}

function hydratedHomeDashboard(page: Page) {
  return page.locator('[data-home-activity-dashboard]:visible').last();
}

async function expectWheelScrollsDocument(
  page: Page,
  route: string,
  selector: string
) {
  await page.setViewportSize({ width: 900, height: 420 });
  const response = await page.goto(route);
  expect(response?.ok()).toBe(true);

  const target =
    route === '/'
      ? hydratedHomeDashboard(page).locator(selector)
      : page.locator(`${selector}:visible`).last();
  await expect(target).toBeVisible({ timeout: 15_000 });
  await target.scrollIntoViewIfNeeded();

  const scrollState = await page.evaluate(() => {
    const element = document.scrollingElement;
    if (!element) throw new Error('Missing document scrolling element');
    const max = element.scrollHeight - element.clientHeight;
    if (element.scrollTop >= max - 8) {
      element.scrollTop = Math.max(0, max - 120);
    }
    return { top: element.scrollTop, max };
  });

  expect(scrollState.max).toBeGreaterThan(0);
  const box = await target.evaluate(element => {
    const rect = element.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });
  expect(box.width).toBeGreaterThan(0);
  expect(box.height).toBeGreaterThan(0);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, 280);

  await expect
    .poll(() => page.evaluate(() => document.scrollingElement?.scrollTop ?? 0))
    .toBeGreaterThan(scrollState.top);
}

for (const route of publicRoutes) {
  test(`${route} renders`, async ({ page }) => {
    const response = await page.goto(route);
    expect(response?.ok()).toBe(true);
    await expect(page.locator('body')).toBeVisible();
  });

  test(`${route} has no horizontal overflow`, async ({ page }) => {
    await page.goto(route);
    await expectNoHorizontalOverflow(page);
  });
}

test('former blog routes return not found', async ({ page }) => {
  for (const route of ['/blog', '/blog/about', '/blog/first-post']) {
    const response = await page.goto(route);
    expect(response?.status()).toBe(404);
    await expect(page.locator('body')).toBeVisible();
  }
});

test('homepage shell covers the viewport with the document background', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const shell = await page.evaluate(() => {
    const root = document.querySelector('nav')?.parentElement;
    if (!root) throw new Error('Missing viewport page shell');
    return {
      shellBackground: getComputedStyle(root).backgroundColor,
      bodyBackground: getComputedStyle(document.body).backgroundColor,
      shellHeight: root.getBoundingClientRect().height,
      viewportHeight: window.innerHeight,
    };
  });

  expect(shell.shellBackground).toBe(shell.bodyBackground);
  expect(shell.shellHeight).toBeGreaterThanOrEqual(shell.viewportHeight);
});

test('desktop clock sits beside the site identity', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  await waitForClientHydration(page);

  const brand = await page
    .getByRole('link', { name: 'teamleaderleo', exact: true })
    .boundingBox();
  const clock = await page
    .getByRole('link', { name: /Open the time converter/i })
    .boundingBox();
  expect(brand).toBeTruthy();
  expect(clock).toBeTruthy();
  expect(clock!.x - (brand!.x + brand!.width)).toBeLessThan(36);
});

test('homepage wheel scrolls over the activity grid', async ({ page }) => {
  await expectWheelScrollsDocument(page, '/', '[data-contribution-week-grid]');
});

test('time page wheel scrolls over the slider', async ({ page }) => {
  await expectWheelScrollsDocument(page, '/time', 'input[type="range"]');
});

test('gallery wheel scrolls over the canvas', async ({ page }) => {
  await expectWheelScrollsDocument(page, '/gallery', 'canvas');
});

test('mobile gallery does not overflow horizontally', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/gallery');
  await expect(page.locator('canvas')).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
