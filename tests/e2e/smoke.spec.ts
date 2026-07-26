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

test('homepage activity tooltip stays anchored through a pointer click', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  await waitForClientHydration(page);

  const grid = page.locator('[aria-label="Four weeks of GitHub activity"]');
  const cell = grid.getByRole('button').nth(8);
  const label = await cell.getAttribute('aria-label');
  expect(label).toBeTruthy();

  const cellBox = await cell.boundingBox();
  expect(cellBox).toBeTruthy();
  const x = cellBox!.x + cellBox!.width / 2;
  const y = cellBox!.y + cellBox!.height / 2;
  await page.mouse.move(x, y);

  const tooltip = page.locator('div.fixed').filter({ hasText: label! });
  await expect(tooltip).toBeVisible();
  const before = await tooltip.boundingBox();
  expect(before).toBeTruthy();

  await page.mouse.click(x, y);
  const after = await tooltip.boundingBox();
  expect(after).toBeTruthy();
  expect(Math.abs(after!.x - before!.x)).toBeLessThan(1);
  expect(Math.abs(after!.y - before!.y)).toBeLessThan(1);
});

test('homepage shell covers the viewport with the document background', async ({ page }) => {
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

  const brand = await page.getByRole('link', { name: 'teamleaderleo', exact: true }).boundingBox();
  const clock = await page.getByRole('link', { name: /Open the time converter/i }).boundingBox();
  expect(brand).toBeTruthy();
  expect(clock).toBeTruthy();
  expect(clock!.x - (brand!.x + brand!.width)).toBeLessThan(36);
});

test('gallery credits the agents who worked here', async ({ page }) => {
  await page.goto('/gallery');

  await expect(page.getByRole('img', { name: 'Draggable nested-cube gallery orbit' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Codex' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Claude Fable' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Mothbit' })).toBeVisible();

  const raccoonCard = page.locator('[data-agent-visit="release-raccoon-install-fix"]');
  const raccoonArtwork = page.getByRole('img', {
    name: 'Release Raccoon wearing a tiny release-engineer cap and holding a laptop beside a tag and checkmark',
  });

  await expect(raccoonCard.getByRole('heading', { name: 'Release Raccoon' })).toBeVisible();
  await expect(raccoonCard.getByText('teamleaderleo/gh-tidy-branches')).toBeVisible();
  await expect(raccoonCard.getByRole('link', { name: 'PR #21' })).toHaveAttribute(
    'href',
    'https://github.com/teamleaderleo/gh-tidy-branches/pull/21',
  );
  await expect(raccoonCard.getByRole('img')).toBeVisible();
  await expect(raccoonArtwork).toHaveCount(1);
});

test('slow navigation keeps the current page visible behind a monotonic rail', async ({ page }) => {
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
  const feedback = page.locator('[data-navigation-feedback]');
  await expect(activity).toBeVisible();

  try {
    const timeLink = page.getByRole('link', { name: /Open the time converter/i });
    const box = await timeLink.boundingBox();
    expect(box).toBeTruthy();
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);

    await expect(feedback).toBeVisible();
    await expect(page.getByText('Opening time')).toHaveCount(0);
    await expect(activity).toBeVisible();

    const initialProgress = Number(await feedback.getAttribute('data-navigation-progress'));
    await expect
      .poll(async () => Number(await feedback.getAttribute('data-navigation-progress')))
      .toBeGreaterThan(initialProgress);
    expect(initialProgress).toBeGreaterThan(0.1);
    expect(initialProgress).toBeLessThanOrEqual(0.9);
  } finally {
    releaseNavigation();
  }

  await expect(page.locator('input[type="range"]')).toBeVisible();
  await expect(feedback).toBeHidden();
  await expect
    .poll(() =>
      page.evaluate(
        () => performance.getEntriesByName('scrapbook:navigation:link').length,
      ),
    )
    .toBeGreaterThan(0);
});

test('navigation rail honours reduced motion without a sweeping loop', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await waitForClientHydration(page);

  await page.evaluate(() => {
    window.dispatchEvent(
      new CustomEvent('scrapbook:navigation-start', {
        detail: { href: '/time', label: 'time' },
      }),
    );
  });

  const progress = page.locator('.navigation-progress');
  await expect(progress).toBeVisible();
  const motion = await progress.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      animationName: style.animationName,
      transitionDuration: style.transitionDuration,
    };
  });
  expect(motion.animationName).toBe('none');
  expect(motion.transitionDuration).toBe('0.001s');

  await page.evaluate(() => window.dispatchEvent(new Event('scrapbook:navigation-cancel')));
  await expect(page.locator('[data-navigation-feedback]')).toBeHidden();
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
