import { expect, test } from '@playwright/test';

const visibleDestinations = [
  ['home', '/'],
  ['space', '/space'],
  ['gallery', '/gallery'],
  ['journal', '/journal'],
  ['time', '/time'],
  ['atelier', '/atelier'],
  ['snow-globe', '/snow-globe'],
] as const;

async function expectNoHorizontalOverflow(
  page: import('@playwright/test').Page
) {
  const metrics = await page.evaluate(() => ({
    viewport: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewport + 1);
  expect(metrics.bodyWidth).toBeLessThanOrEqual(metrics.viewport + 1);
}

test('site atlas exposes visible places, tools, experiments, and connections', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.locator('[data-site-atlas-trigger]').click();

  const atlas = page.locator('[data-site-atlas]');
  await expect(atlas).toBeVisible();
  await expect(atlas.getByRole('heading', { name: 'Places' })).toBeVisible();
  await expect(atlas.getByRole('heading', { name: 'Tools' })).toBeVisible();
  await expect(
    atlas.getByRole('heading', { name: 'Experiments' })
  ).toBeVisible();
  await expect(
    atlas.getByRole('heading', { name: 'Connections' })
  ).toBeVisible();

  for (const [id, href] of visibleDestinations) {
    await expect(
      atlas.locator(`[data-site-atlas-link="${id}"]`)
    ).toHaveAttribute('href', href);
  }
  await expect(atlas.locator('[data-site-atlas-link="blog"]')).toHaveCount(0);

  for (const id of ['proxy', 'activity-lab', 'sigil-lab']) {
    await expect(atlas.locator(`[data-site-atlas-link="${id}"]`)).toBeVisible();
  }

  const github = atlas.locator('[data-site-atlas-link="github"]');
  await expect(github).toHaveAttribute('target', '_blank');
  await expect(github).toHaveAttribute('rel', /noopener/);
  await expect(atlas.locator('[data-site-atlas-discord]')).toBeVisible();
  await expect(atlas.locator('[data-site-atlas-appearance]')).toBeVisible();

  await page.screenshot({
    path: testInfo.outputPath(
      `site-atlas-desktop-${testInfo.project.name}.png`
    ),
    fullPage: true,
  });
});

test('retired blog routes are not public navigation destinations', async ({
  page,
}) => {
  for (const path of ['/blog', '/blog/about']) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
  }

  await page.goto('/');
  await expect(page.locator('[data-site-primary-link="blog"]')).toHaveCount(0);
  await page.locator('[data-site-atlas-trigger]').click();
  await expect(page.locator('[data-site-atlas-link="blog"]')).toHaveCount(0);
});

test('Escape closes the atlas and restores focus to its trigger', async ({
  page,
}) => {
  await page.goto('/');
  const trigger = page.locator('[data-site-atlas-trigger]');
  await trigger.focus();
  await trigger.click();
  await expect(page.locator('[data-site-atlas]')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.locator('[data-site-atlas]')).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('opening the atlas preserves the page geometry and owns one scroll area', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 760 });
  await page.goto('/');
  await page.evaluate(() => window.scrollTo(0, 320));

  const nav = page.locator('[data-site-nav]');
  const trigger = page.locator('[data-site-atlas-trigger]');
  const before = await page.evaluate(() => {
    const rect = document
      .querySelector('[data-site-nav]')!
      .getBoundingClientRect();
    return {
      navX: rect.x,
      navWidth: rect.width,
      scrollY: window.scrollY,
      documentWidth: document.documentElement.scrollWidth,
    };
  });

  await trigger.click();
  const atlas = page.locator('[data-site-atlas]');
  const atlasScroll = page.locator('[data-site-atlas-scroll]');
  await expect(atlas).toBeVisible();
  await expect(page.locator('body')).toHaveAttribute('data-scroll-locked', '1');

  const open = await page.evaluate(() => {
    const rect = document
      .querySelector('[data-site-nav]')!
      .getBoundingClientRect();
    const overlay = getComputedStyle(
      document.querySelector('[data-site-atlas-overlay]')!
    );
    return {
      navX: rect.x,
      navWidth: rect.width,
      scrollY: window.scrollY,
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      backdropFilter: overlay.backdropFilter,
      filter: overlay.filter,
    };
  });

  expect(open.documentWidth).toBeLessThanOrEqual(open.viewportWidth + 1);
  expect(Math.abs(open.navX - before.navX)).toBeLessThan(1);
  expect(Math.abs(open.navWidth - before.navWidth)).toBeLessThan(1);
  expect(open.scrollY).toBe(before.scrollY);
  expect(open.backdropFilter).toBe('none');
  expect(open.filter).toBe('none');
  await expect(atlasScroll).toHaveCSS('overflow-y', 'auto');

  await page.keyboard.press('Escape');
  await expect(atlas).toBeHidden();
  await expect(nav).toBeVisible();
  const closed = await page.evaluate(() => {
    const rect = document
      .querySelector('[data-site-nav]')!
      .getBoundingClientRect();
    return {
      navX: rect.x,
      navWidth: rect.width,
      scrollY: window.scrollY,
      documentWidth: document.documentElement.scrollWidth,
    };
  });
  expect(Math.abs(closed.navX - before.navX)).toBeLessThan(1);
  expect(Math.abs(closed.navWidth - before.navWidth)).toBeLessThan(1);
  expect(closed.scrollY).toBe(before.scrollY);
  expect(closed.documentWidth).toBe(before.documentWidth);
});

for (const viewport of [
  { name: 'portrait', width: 390, height: 844 },
  { name: 'landscape', width: 740, height: 390 },
]) {
  test(`mobile ${viewport.name} atlas keeps touch targets and natural overflow`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    await page.goto('/');
    await expectNoHorizontalOverflow(page);

    await page.locator('[data-site-atlas-trigger]').click();
    await expect(page.locator('[data-site-atlas]')).toBeVisible();
    await expectNoHorizontalOverflow(page);

    const targetSelector = [
      '[data-site-atlas-trigger]',
      '[data-site-atlas-close]',
      '[data-site-atlas-link]',
      '[data-site-atlas-discord]',
      '[data-site-atlas-appearance]',
    ].join(',');
    const sizes = await page.locator(targetSelector).evaluateAll(elements =>
      elements.map(element => {
        const rect = element.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      })
    );

    expect(sizes.length).toBeGreaterThan(10);
    for (const size of sizes) {
      expect(size.width).toBeGreaterThanOrEqual(44);
      expect(size.height).toBeGreaterThanOrEqual(44);
    }

    if (viewport.name === 'portrait') {
      await page.screenshot({
        path: testInfo.outputPath(
          `site-atlas-mobile-${testInfo.project.name}.png`
        ),
        fullPage: true,
      });
    }

    await page.locator('[data-site-atlas-scroll]').evaluate(element => {
      element.scrollTop = element.scrollHeight;
    });
    await expect(page.locator('[data-site-atlas-appearance]')).toBeVisible();
  });
}
