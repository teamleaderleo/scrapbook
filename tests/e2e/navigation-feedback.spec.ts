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

function expectMonotonicReplacement(result: { before: number; samples: number[] }) {
  expect(result.samples[0]).toBeGreaterThanOrEqual(result.before - 1);
  for (let index = 1; index < result.samples.length; index += 1) {
    expect(result.samples[index]).toBeGreaterThanOrEqual(result.samples[index - 1] - 0.5);
  }
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
  expectMonotonicReplacement(result);
}

async function navigateAndSampleReplacementDuringFade(page: Page, replacementHref: string) {
  const result = await page.evaluate(
    ({ replacementDestination }) =>
      new Promise<{ before: number; samples: number[] } | null>((resolve) => {
        let finished = false;
        let timeout = 0;
        const observerRef: { current: MutationObserver | null } = { current: null };

        const finish = (value: { before: number; samples: number[] } | null) => {
          if (finished) return;
          finished = true;
          window.clearTimeout(timeout);
          observerRef.current?.disconnect();
          resolve(value);
        };

        const observeFade = () => {
          const feedbackElement = document.querySelector<HTMLElement>('[data-navigation-feedback]');
          const progressElement = document.querySelector<HTMLElement>('.navigation-progress');
          if (
            finished ||
            !feedbackElement ||
            !progressElement ||
            feedbackElement.dataset.navigationState !== 'fading'
          ) {
            return;
          }

          const before = progressElement.getBoundingClientRect().width;
          const samples: number[] = [];
          window.dispatchEvent(
            new CustomEvent('scrapbook:navigation-start', {
              detail: {
                href: replacementDestination,
                label: replacementDestination.slice(1),
              },
            }),
          );

          const sample = () => {
            samples.push(progressElement.getBoundingClientRect().width);
            if (samples.length >= 12) finish({ before, samples });
            else requestAnimationFrame(sample);
          };
          requestAnimationFrame(sample);
        };

        const observer = new MutationObserver(observeFade);
        observerRef.current = observer;
        observer.observe(document.documentElement, {
          subtree: true,
          childList: true,
          attributes: true,
          attributeFilter: ['data-navigation-state'],
        });
        timeout = window.setTimeout(() => finish(null), 5_000);

        const timeLink = document.querySelector<HTMLAnchorElement>('[data-site-time]');
        if (!timeLink) {
          finish(null);
          return;
        }

        // Use a real hydrated internal navigation; the observer stays inside the page lifecycle.
        timeLink.click();
        observeFade();
      }),
    { replacementDestination: replacementHref },
  );

  expect(result).not.toBeNull();
  if (!result) throw new Error('A real internal navigation never entered the fade phase');
  await expect(feedback(page)).toHaveAttribute('data-navigation-href', replacementHref);
  expectMonotonicReplacement(result);
}

async function cancelNavigationFeedback(page: Page) {
  await page.evaluate(() => window.dispatchEvent(new Event('scrapbook:navigation-cancel')));
  await expect(feedback(page)).toBeHidden();
}

test('navigation progress advances on a continuous compositor timeline', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');

  // Establish that the client listener has hydrated, then measure a fresh navigation entirely in-page.
  await startNavigationFeedback(page, '/time');
  await cancelNavigationFeedback(page);

  const measurement = await page.evaluate(
    () =>
      new Promise<{
        initialTime: number;
        finalTime: number;
        initialWidth: number;
        finalWidth: number;
        playState: AnimationPlayState;
        keyframes: Array<{ offset: number | null; transform: string }>;
        transitionDuration: string;
      } | null>((resolve) => {
        window.dispatchEvent(
          new CustomEvent('scrapbook:navigation-start', {
            detail: { href: '/gallery', label: 'gallery' },
          }),
        );

        const deadline = performance.now() + 1_500;
        const waitForAnimation = () => {
          const element = document.querySelector<HTMLElement>('.navigation-progress');
          const animation = element?.getAnimations()[0];
          if (!element || !animation) {
            if (performance.now() >= deadline) {
              resolve(null);
              return;
            }
            requestAnimationFrame(waitForAnimation);
            return;
          }

          const effect = animation.effect as KeyframeEffect | null;
          const keyframes = (effect?.getKeyframes() ?? []).map((keyframe) => ({
            offset: keyframe.computedOffset ?? keyframe.offset ?? null,
            transform: String(keyframe.transform ?? ''),
          }));
          const initialTime = Number(animation.currentTime ?? 0);
          const initialWidth = element.getBoundingClientRect().width;
          const transitionDuration = getComputedStyle(element).transitionDuration;

          window.setTimeout(() => {
            requestAnimationFrame(() => {
              resolve({
                initialTime,
                finalTime: Number(animation.currentTime ?? 0),
                initialWidth,
                finalWidth: element.getBoundingClientRect().width,
                playState: animation.playState,
                keyframes,
                transitionDuration,
              });
            });
          }, 320);
        };

        requestAnimationFrame(waitForAnimation);
      }),
  );

  expect(measurement).not.toBeNull();
  if (!measurement) throw new Error('Navigation compositor animation did not start');
  expect(measurement.playState).toBe('running');
  expect(measurement.finalTime).toBeGreaterThan(measurement.initialTime + 100);
  expect(measurement.finalWidth).toBeGreaterThan(measurement.initialWidth + 1);
  expect(measurement.transitionDuration).toBe('0s');
  expect(measurement.keyframes).toHaveLength(7);
  expect(new Set(measurement.keyframes.map((keyframe) => keyframe.transform)).size).toBe(7);
  for (let index = 1; index < measurement.keyframes.length; index += 1) {
    expect(measurement.keyframes[index].offset).toBeGreaterThan(
      measurement.keyframes[index - 1].offset ?? -1,
    );
  }

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
  await expect(page.locator('[data-site-nav-ready="true"]')).toBeVisible({ timeout: 15_000 });

  // Confirm the feedback listener is hydrated before starting the real Link navigation.
  await startNavigationFeedback(page, '/gallery');
  await cancelNavigationFeedback(page);

  await navigateAndSampleReplacementDuringFade(page, '/gallery');
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
