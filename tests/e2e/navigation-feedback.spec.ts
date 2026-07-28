import { expect, test, type Page } from '@playwright/test';

const feedback = (page: Page) => page.locator('[data-navigation-feedback]');
const progress = (page: Page) => page.locator('.navigation-progress');

async function startNavigationFeedback(page: Page, href = '/time', label = 'time') {
  await expect
    .poll(() =>
      page.evaluate(
        ({ destination, destinationLabel }) => {
          window.dispatchEvent(
            new CustomEvent('scrapbook:navigation-start', {
              detail: { href: destination, label: destinationLabel },
            }),
          );
          return document
            .querySelector('[data-navigation-feedback]')
            ?.getAttribute('data-navigation-href');
        },
        { destination: href, destinationLabel: label },
      ),
    )
    .toBe(href);
}

async function settleNavigation(page: Page, href: string) {
  await page.evaluate((destination) => window.history.pushState({}, '', destination), href);
}

async function sampleReplacement(page: Page, href: string) {
  const result = await progress(page).evaluate(
    (element, destination) =>
      new Promise<{ before: number; samples: number[] }>((resolve) => {
        const before = element.getBoundingClientRect().width;
        const samples: number[] = [];

        window.dispatchEvent(
          new CustomEvent('scrapbook:navigation-start', {
            detail: { href: destination, label: destination.slice(1) },
          }),
        );

        const sample = () => {
          samples.push(element.getBoundingClientRect().width);
          if (samples.length >= 12) resolve({ before, samples });
          else requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      }),
    href,
  );

  await expect(feedback(page)).toHaveAttribute('data-navigation-href', href);
  expect(result.samples[0]).toBeGreaterThanOrEqual(result.before - 1);
  for (let index = 1; index < result.samples.length; index += 1) {
    expect(result.samples[index]).toBeGreaterThanOrEqual(result.samples[index - 1] - 0.5);
  }
}

async function cancelNavigationFeedback(page: Page) {
  await page.evaluate(() => window.dispatchEvent(new Event('scrapbook:navigation-cancel')));
  await expect(feedback(page)).toBeHidden();
}

test('navigation progress advances continuously on compositor frames', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await startNavigationFeedback(page);

  await expect(progress(page)).toBeVisible();
  await expect.poll(() => progress(page).evaluate((element) => element.getAnimations().length)).toBe(1);

  const samples = await progress(page).evaluate(
    (element) =>
      new Promise<number[]>((resolve) => {
        const widths: number[] = [];
        const sample = () => {
          widths.push(element.getBoundingClientRect().width);
          if (widths.length >= 18) resolve(widths);
          else requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      }),
  );

  const rounded = samples.map((width) => Math.round(width * 10) / 10);
  expect(new Set(rounded).size).toBeGreaterThan(8);
  for (let index = 1; index < samples.length; index += 1) {
    expect(samples[index]).toBeGreaterThanOrEqual(samples[index - 1] - 0.25);
  }

  const motion = await progress(page).evaluate((element) => {
    const style = getComputedStyle(element);
    return { transitionDuration: style.transitionDuration };
  });
  expect(motion.transitionDuration).toBe('0s');

  await cancelNavigationFeedback(page);
});

test('replacement during settling preserves the rendered width', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await startNavigationFeedback(page, '/time');
  await settleNavigation(page, '/time');
  await expect(feedback(page)).toHaveAttribute('data-navigation-state', 'settling');

  await sampleReplacement(page, '/gallery');
  await cancelNavigationFeedback(page);
});

test('replacement during the completion hold never jumps backwards', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await startNavigationFeedback(page, '/time');
  await page.waitForTimeout(240);
  await settleNavigation(page, '/time');
  await expect(feedback(page)).toHaveAttribute('data-navigation-state', 'completing');

  await sampleReplacement(page, '/gallery');
  await cancelNavigationFeedback(page);
});

test('replacement during the fade never jumps backwards', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await startNavigationFeedback(page, '/time');
  await page.waitForTimeout(240);
  await settleNavigation(page, '/time');
  await expect(feedback(page)).toHaveAttribute('data-navigation-state', 'fading');

  await sampleReplacement(page, '/gallery');
  await cancelNavigationFeedback(page);
});

test('reduced motion keeps navigation progress static and animation-free', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await startNavigationFeedback(page);

  await expect(progress(page)).toBeVisible();
  expect(await progress(page).evaluate((element) => element.getAnimations().length)).toBe(0);

  const widths = await progress(page).evaluate(
    (element) =>
      new Promise<number[]>((resolve) => {
        const samples: number[] = [];
        const sample = () => {
          samples.push(element.getBoundingClientRect().width);
          if (samples.length >= 8) resolve(samples);
          else requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      }),
  );
  expect(new Set(widths.map((width) => Math.round(width * 10) / 10)).size).toBe(1);

  await cancelNavigationFeedback(page);
});
