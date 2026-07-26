import { expect, test, type Page } from '@playwright/test';

const publicRoutes = ['/', '/time', '/blog', '/gallery', '/atelier'];
const idleDigitTransform =
  'translate3d(0px, 0px, 0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1)';

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

async function expectWheelScrollsDocument(page: Page, route: string, selector: string) {
  await page.setViewportSize({ width: 900, height: 420 });
  const response = await page.goto(route);
  expect(response?.ok()).toBe(true);

  await expect(page.locator(selector).first()).toBeVisible();
  await page.evaluate((targetSelector) => {
    document.querySelector(targetSelector)?.scrollIntoView({ block: 'center' });
  }, selector);

  const scrollState = await page.evaluate(() => {
    const element = document.scrollingElement;
    if (!element) throw new Error('Missing document scrolling element');
    const max = element.scrollHeight - element.clientHeight;
    if (element.scrollTop >= max - 8) element.scrollTop = Math.max(0, max - 120);
    return { top: element.scrollTop, max };
  });

  expect(scrollState.max).toBeGreaterThan(0);
  const box = await page.locator(selector).first().boundingBox();
  expect(box).toBeTruthy();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.wheel(0, 280);

  await expect
    .poll(() => page.evaluate(() => document.scrollingElement?.scrollTop ?? 0))
    .toBeGreaterThan(scrollState.top);
}

async function moveActivityDigits(page: Page) {
  await waitForClientHydration(page);

  const digits = page.locator('[data-activity-digit]');
  await expect(digits).toHaveCount(4);
  const container = digits.first().locator('..');
  const box = await container.boundingBox();
  expect(box).toBeTruthy();

  await page.mouse.move(
    box!.x + box!.width * 0.14,
    box!.y + box!.height * 0.22,
    { steps: 3 },
  );

  return digits;
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

test('homepage highlights three recent systems', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Recent systems', { exact: true })).toBeVisible();
  await expect(page.getByText('Tools that remember their boundaries')).toHaveCount(0);
  await expect(page.getByRole('link', { name: /smolrunner/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /stensibly/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /proofwake/i })).toBeVisible();
});

test('homepage counter uses UTC, 7D, and YTD instrument labels', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText(/UTC reset \d{2}:\d{2}:\d{2}/)).toBeVisible();
  await expect(page.getByText('7D', { exact: true })).toBeVisible();
  await expect(page.getByText('YTD', { exact: true })).toBeVisible();
  await expect(page.locator('[data-activity-digit] > span')).toHaveCount(4);
});

test('gallery credits the agents who worked here', async ({ page }) => {
  await page.goto('/gallery');

  await expect(page.getByRole('heading', { name: 'Codex' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Claude Fable' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Mothbit' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Release Raccoon' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Release Raccoon was here' })).toBeVisible();
});

test('slow navigation keeps the current page visible with immediate feedback', async ({ page }) => {
  await page.addInitScript(() => {
    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    idleWindow.requestIdleCallback = () => 1;
    idleWindow.cancelIdleCallback = () => {};
  });

  let releaseNavigation!: () => void;
  const navigationGate = new Promise<void>((resolve) => {
    releaseNavigation = resolve;
  });

  await page.route(
    (url) => url.pathname === '/time',
    async (route) => {
      await navigationGate;
      await route.continue();
    },
  );

  await page.goto('/');
  await waitForClientHydration(page);

  const activity = page.locator('[aria-label="Four weeks of GitHub activity"]');
  await expect(activity).toBeVisible();

  try {
    const timeLink = page.getByRole('link', { name: /Open the time converter/i });
    const box = await timeLink.boundingBox();
    expect(box).toBeTruthy();
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);

    await expect(page.getByText('Opening time')).toBeVisible();
    await expect(activity).toBeVisible();
  } finally {
    releaseNavigation();
  }

  await expect(page.locator('input[type="range"]')).toBeVisible();
  await expect(page.getByText('Opening time')).toBeHidden();
});

test('homepage wheel scrolls over the activity grid', async ({ page }) => {
  await expectWheelScrollsDocument(page, '/', '[aria-label="Four weeks of GitHub activity"]');
});

test('time page wheel scrolls over the slider', async ({ page }) => {
  await expectWheelScrollsDocument(page, '/time', 'input[type="range"]');
});

test('gallery wheel scrolls over the canvas', async ({ page }) => {
  await expectWheelScrollsDocument(page, '/gallery', 'canvas');
});

test('homepage counter uses four independently reactive wind-lift digits', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const digits = await moveActivityDigits(page);

  await expect
    .poll(() => digits.first().evaluate((element) => (element as HTMLElement).style.transform))
    .not.toBe(idleDigitTransform);

  const transforms = await digits.evaluateAll((elements) =>
    elements.map((element) => (element as HTMLElement).style.transform),
  );
  expect(new Set(transforms).size).toBeGreaterThan(1);
  expect(transforms[0]).not.toEqual(transforms[3]);
  expect(transforms.some((transform) => /translate3d\([^,]+, -(?:[4-9]|\d{2})/.test(transform))).toBe(true);
});

test('homepage counter respects reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const digits = await moveActivityDigits(page);

  const transforms = await digits.evaluateAll((elements) =>
    elements.map((element) => (element as HTMLElement).style.transform),
  );
  expect(new Set(transforms)).toEqual(new Set([idleDigitTransform]));
});

test('mobile gallery does not overflow horizontally', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/gallery');
  await expect(page.locator('canvas')).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
