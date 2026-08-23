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

async function waitForHomeActivity(page: Page) {
  const dashboard = hydratedHomeDashboard(page);
  await expect(dashboard).toBeVisible({ timeout: 15_000 });
  await expect(
    dashboard.locator('[data-contribution-week-grid]')
  ).toBeVisible();
  return dashboard;
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
    if (element.scrollTop >= max - 8)
      element.scrollTop = Math.max(0, max - 120);
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

test('homepage keeps a factual repository ledger without promotional copy', async ({
  page,
}) => {
  await page.goto('/');
  await waitForHomeActivity(page);

  await expect(page.getByText('Recent systems', { exact: true })).toHaveCount(
    0
  );
  await expect(
    page.getByText('Tools that remember their boundaries')
  ).toHaveCount(0);
  await expect(page.getByText(/not guess/i)).toHaveCount(0);
  await expect(page.locator('[data-home-repository]')).toHaveCount(2);
  for (const repository of ['preflight', 'stensibly']) {
    await expect(
      page.locator(`[data-home-repository="${repository}"]`)
    ).toBeVisible();
  }
  await expect(
    page.getByText('Starsector launch performance.', { exact: true })
  ).toBeVisible();
  await expect(
    page.getByText('Agent coordination system.', { exact: true })
  ).toBeVisible();
});

test('homepage counter uses UTC, 7D, and rolling-year instrument labels', async ({
  page,
}) => {
  await page.goto('/');
  const dashboard = await waitForHomeActivity(page);

  await expect(
    dashboard.getByText(/UTC reset \d{2}:\d{2}:\d{2}/)
  ).toBeVisible();
  await expect(dashboard.getByText('7D', { exact: true })).toBeVisible();
  await expect(dashboard.getByText('1Y', { exact: true })).toBeVisible();
  await expect(dashboard.locator('[data-activity-digit] > span')).toHaveCount(
    4
  );
});

test('homepage activity tooltip stays anchored through a pointer click', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  await waitForClientHydration(page);
  const dashboard = await waitForHomeActivity(page);

  const grid = dashboard.locator('[data-contribution-week-grid]');
  const cell = grid.getByRole('button').nth(8);
  await expect(cell).toBeVisible();

  const label = await cell.getAttribute('aria-label');
  expect(label).toBeTruthy();
  const cellBox = await cell.evaluate(element => {
    const rect = element.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });
  const x = cellBox.x + cellBox.width / 2;
  const y = cellBox.y + cellBox.height / 2;
  await cell.hover();

  const tooltip = page.locator('div.fixed').filter({ hasText: label! });
  await expect(tooltip).toBeVisible({ timeout: 10_000 });
  const before = await tooltip.evaluate(element => {
    const rect = element.getBoundingClientRect();
    return { x: rect.x, y: rect.y };
  });

  await page.mouse.click(x, y);
  await expect(tooltip).toBeVisible();
  const after = await tooltip.evaluate(element => {
    const rect = element.getBoundingClientRect();
    return { x: rect.x, y: rect.y };
  });
  expect(Math.abs(after.x - before.x)).toBeLessThan(1);
  expect(Math.abs(after.y - before.y)).toBeLessThan(1);
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

test('gallery credits the agents who worked here', async ({ page }) => {
  await page.goto('/gallery');

  await expect(
    page.getByRole('img', {
      name: 'Draggable projected four-dimensional hypercube',
    })
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Codex' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Claude Fable' })
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Mothbit' })).toBeVisible();
  await expect(page.getByText('Mothbit was here', { exact: true })).toHaveCount(
    0
  );

  const raccoonCard = page.locator(
    '[data-agent-visit="release-raccoon-install-fix"]'
  );
  await expect(
    raccoonCard.getByRole('heading', { name: 'Release Raccoon' })
  ).toBeVisible();
  await expect(
    raccoonCard.getByText('teamleaderleo/gh-tidy-branches')
  ).toBeVisible();
  await expect(
    raccoonCard.getByRole('link', { name: 'PR #21' })
  ).toHaveAttribute(
    'href',
    'https://github.com/teamleaderleo/gh-tidy-branches/pull/21'
  );
  await expect(page.locator('[data-agent-visit] img')).toHaveCount(0);
});

test('slow navigation keeps the current page visible behind a monotonic rail', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    idleWindow.requestIdleCallback = () => 1;
    idleWindow.cancelIdleCallback = () => {};
  });

  let releaseNavigation!: () => void;
  const navigationGate = new Promise<void>(resolve => {
    releaseNavigation = resolve;
  });

  await page.route(
    url => url.pathname === '/time',
    async route => {
      await navigationGate;
      await route.continue();
    }
  );

  await page.goto('/');
  await waitForClientHydration(page);
  const dashboard = await waitForHomeActivity(page);

  const activity = dashboard.locator('[data-contribution-week-grid]');
  const feedback = page.locator('[data-navigation-feedback]');
  await expect(activity).toBeVisible();

  try {
    const timeLink = page.getByRole('link', {
      name: /Open the time converter/i,
    });
    const box = await timeLink.boundingBox();
    expect(box).toBeTruthy();
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);

    await expect(feedback).toBeVisible();
    await expect(page.getByText('Opening time')).toHaveCount(0);
    await expect(activity).toBeVisible();

    const initialProgress = Number(
      await feedback.getAttribute('data-navigation-progress')
    );
    await expect
      .poll(async () =>
        Number(await feedback.getAttribute('data-navigation-progress'))
      )
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
        () => performance.getEntriesByName('scrapbook:navigation:link').length
      )
    )
    .toBeGreaterThan(0);
});

test('navigation rail honours reduced motion without a sweeping loop', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await waitForClientHydration(page);

  await page.evaluate(() => {
    window.dispatchEvent(
      new CustomEvent('scrapbook:navigation-start', {
        detail: { href: '/time', label: 'time' },
      })
    );
  });

  const progress = page.locator('.navigation-progress');
  await expect(progress).toBeVisible();
  const motion = await progress.evaluate(element => {
    const style = getComputedStyle(element);
    return {
      animationName: style.animationName,
      transitionDuration: style.transitionDuration,
    };
  });
  expect(motion.animationName).toBe('none');
  expect(motion.transitionDuration).toBe('0.001s');

  await page.evaluate(() =>
    window.dispatchEvent(new Event('scrapbook:navigation-cancel'))
  );
  await expect(page.locator('[data-navigation-feedback]')).toBeHidden();
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

test('homepage scorecard stays planted under pointer movement', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const dashboard = await waitForHomeActivity(page);

  const scoreboard = dashboard.locator('[data-activity-scoreboard]');
  const counter = scoreboard.locator('[data-paper-counter]');
  await expect(scoreboard).toBeVisible();
  await expect(scoreboard).toHaveAttribute(
    'data-activity-scoreboard-ready',
    'true'
  );
  await expect(scoreboard).toHaveAttribute('data-activity-motion', 'calm');
  await expect(counter).toHaveAttribute('data-reduced-motion', 'false');

  // Activity now follows the operator console. Establish the interaction viewport
  // before sampling geometry so pointer movement itself cannot trigger scrolling.
  await scoreboard.scrollIntoViewIfNeeded();
  const before = await scoreboard.evaluate(element => {
    const rect = element.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });

  const box = await scoreboard.boundingBox();
  expect(box).not.toBeNull();
  if (!box) throw new Error('Scoreboard did not expose a pointer target');
  await page.mouse.move(1, 1);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
    steps: 6,
  });
  await expect
    .poll(() => scoreboard.evaluate(element => element.matches(':hover')))
    .toBe(true);
  await page.waitForTimeout(350);
  const after = await scoreboard.evaluate(element => {
    const rect = element.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });

  expect(Math.abs(after.x - before.x)).toBeLessThan(1);
  expect(Math.abs(after.y - before.y)).toBeLessThan(1);
  expect(Math.abs(after.width - before.width)).toBeLessThan(1);
  expect(Math.abs(after.height - before.height)).toBeLessThan(1);
});

test('homepage scorecard remains planted with reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const dashboard = await waitForHomeActivity(page);

  const scoreboard = dashboard.locator('[data-activity-scoreboard]');
  const counter = scoreboard.locator('[data-paper-counter]');
  await expect(scoreboard).toBeVisible();
  await expect(scoreboard).toHaveAttribute(
    'data-activity-scoreboard-ready',
    'true'
  );
  await expect(scoreboard).toHaveAttribute('data-activity-motion', 'reduced');
  await expect(counter).toHaveAttribute('data-reduced-motion', 'true');

  await scoreboard.scrollIntoViewIfNeeded();
  const before = await scoreboard.evaluate(element => {
    const rect = element.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });

  const box = await scoreboard.boundingBox();
  expect(box).not.toBeNull();
  if (!box) throw new Error('Scoreboard did not expose a pointer target');
  await page.mouse.move(1, 1);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
    steps: 6,
  });
  await expect
    .poll(() => scoreboard.evaluate(element => element.matches(':hover')))
    .toBe(true);
  await page.waitForTimeout(500);
  const after = await scoreboard.evaluate(element => {
    const rect = element.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });

  expect(Math.abs(after.x - before.x)).toBeLessThan(1);
  expect(Math.abs(after.y - before.y)).toBeLessThan(1);
  expect(Math.abs(after.width - before.width)).toBeLessThan(1);
  expect(Math.abs(after.height - before.height)).toBeLessThan(1);
});

test('mobile gallery does not overflow horizontally', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/gallery');
  await expect(page.locator('canvas')).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
