import { expect, test, type Locator } from '@playwright/test';

type ThemeTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { finished: Promise<unknown> };
};

function backgroundAlpha(value: string) {
  const match = value.match(/^rgba?\(([^)]+)\)$/);
  if (!match) return 1;
  const parts = match[1].split(',').map(part => part.trim());
  return parts.length === 4 ? Number(parts[3]) : 1;
}

async function expectOpaqueSurface(locator: Locator) {
  const style = await locator.evaluate(element => {
    const computed = getComputedStyle(element);
    return {
      backgroundColor: computed.backgroundColor,
      backdropFilter: computed.backdropFilter,
      webkitBackdropFilter: computed.getPropertyValue(
        '-webkit-backdrop-filter'
      ),
    };
  });

  expect(backgroundAlpha(style.backgroundColor)).toBe(1);
  expect(style.backdropFilter === 'none' || style.backdropFilter === '').toBe(
    true
  );
  expect(
    style.webkitBackdropFilter === 'none' || style.webkitBackdropFilter === ''
  ).toBe(true);
}

test('navigation and mobile site atlas use opaque surfaces', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  await expectOpaqueSurface(page.locator('nav'));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('[data-site-nav]')).toHaveAttribute(
    'data-site-nav-ready',
    'true'
  );
  await page.locator('[data-site-atlas-trigger]').click();
  const atlas = page.locator('[data-site-atlas]');
  await expect(atlas).toBeVisible();
  await expectOpaqueSurface(atlas);
});

test('time picker omits recent-zone chrome and stays opaque', async ({
  page,
}) => {
  await page.goto('/time');

  await expect(page.getByText('Recent zones', { exact: true })).toHaveCount(0);
  await expectOpaqueSurface(page.locator('[data-timezone-instrument]'));

  await page.locator('[data-timezone-trigger]').click();
  const picker = page.locator('[data-timezone-picker]');
  await expect(picker).toBeVisible();
  await expectOpaqueSurface(picker);
});

test('theme aperture softens the root swap and has restrained idle motion', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const transitionDocument = document as ThemeTransitionDocument;
    const original = transitionDocument.startViewTransition?.bind(document);
    if (!original) return;
    transitionDocument.startViewTransition = update => {
      (
        window as Window & { __themeViewTransitionStarted?: boolean }
      ).__themeViewTransitionStarted = true;
      return original(update);
    };
  });
  await page.addInitScript(() => window.localStorage.setItem('theme', 'light'));
  await page.goto('/');

  const toggle = page.locator('[data-theme-toggle]').first();
  const corona = toggle.locator('[data-theme-corona]');
  const sunSpark = toggle.locator('[data-theme-sun-spark]').first();
  const moon = toggle.locator('[data-theme-moon]');

  await expect(toggle).toBeVisible();
  await expect(sunSpark).toBeVisible();
  const lightMotion = await corona.evaluate(
    element => getComputedStyle(element).animationName
  );
  const sparkMotion = await sunSpark.evaluate(
    element => getComputedStyle(element).animationName
  );
  const transition = await moon.evaluate(
    element => getComputedStyle(element).transitionDuration
  );
  expect(lightMotion).not.toBe('none');
  expect(sparkMotion).not.toBe('none');
  expect(transition).not.toBe('0s');

  await toggle.click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  expect(
    await page.evaluate(
      () =>
        (window as Window & { __themeViewTransitionStarted?: boolean })
          .__themeViewTransitionStarted
    )
  ).toBe(true);
  await expect
    .poll(() =>
      moon.evaluate(element => Number(getComputedStyle(element).opacity))
    )
    .toBeGreaterThan(0.9);
  await expect
    .poll(() =>
      sunSpark.evaluate(element => Number(getComputedStyle(element).opacity))
    )
    .toBeLessThan(0.1);

  const starMotion = await toggle
    .locator('[data-theme-star]')
    .first()
    .evaluate(element => getComputedStyle(element).animationName);
  expect(starMotion).not.toBe('none');
});

test('reduced motion changes theme without starting a root transition', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    const transitionDocument = document as ThemeTransitionDocument;
    const original = transitionDocument.startViewTransition?.bind(document);
    if (!original) return;
    transitionDocument.startViewTransition = update => {
      (
        window as Window & { __themeViewTransitionStarted?: boolean }
      ).__themeViewTransitionStarted = true;
      return original(update);
    };
    window.localStorage.setItem('theme', 'light');
  });
  await page.goto('/');

  await page.locator('[data-theme-toggle]').first().click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  expect(
    await page.evaluate(
      () =>
        (window as Window & { __themeViewTransitionStarted?: boolean })
          .__themeViewTransitionStarted
    )
  ).not.toBe(true);
});
