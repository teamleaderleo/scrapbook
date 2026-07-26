import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const EVIDENCE_PHASE = 'after';

const timeStudies = [
  { theme: 'light', width: 390, height: 844 },
  { theme: 'dark', width: 390, height: 844 },
  { theme: 'light', width: 1366, height: 768 },
  { theme: 'dark', width: 1440, height: 900 },
] as const;

async function setTheme(page: Page, theme: 'light' | 'dark') {
  await page.addInitScript((nextTheme) => {
    window.localStorage.setItem('theme', nextTheme);
  }, theme);
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

async function waitForClientHydration(page: Page) {
  const timeLink = page.getByRole('link', { name: /Open the time converter/i });
  await expect
    .poll(() => timeLink.getAttribute('aria-label'))
    .not.toContain('Local time --:--');
}

async function evidencePath(
  testInfo: TestInfo,
  group: string,
  name: string,
) {
  const target = path.join(
    'test-results',
    'material-instruments',
    EVIDENCE_PHASE,
    group,
    testInfo.project.name,
    `${name}.png`,
  );
  await mkdir(path.dirname(target), { recursive: true });
  return target;
}

for (const study of timeStudies) {
  test(`captures ${study.theme} time instrument at ${study.width}x${study.height}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: study.width, height: study.height });
    await setTheme(page, study.theme);
    const response = await page.goto('/time');
    expect(response?.ok()).toBe(true);

    const root = page.locator('html');
    await expect(root).toHaveClass(new RegExp(study.theme));

    const housing = page.locator('[data-material-role="instrument-housing"]');
    const readout = page.locator('[data-material-role="instrument-readout"]');
    const trigger = page.locator('[data-timezone-trigger]');
    await expect(housing).toBeVisible();
    await expect(readout).toBeVisible();
    await expectNoHorizontalOverflow(page);

    const materialStyles = await page.evaluate(() => {
      const housingElement = document.querySelector<HTMLElement>(
        '[data-material-role="instrument-housing"]',
      );
      const readoutElement = document.querySelector<HTMLElement>(
        '[data-material-role="instrument-readout"]',
      );
      if (!housingElement || !readoutElement) throw new Error('Missing time instrument');
      return {
        housingBackgroundImage: getComputedStyle(housingElement).backgroundImage,
        readoutBackgroundImage: getComputedStyle(readoutElement).backgroundImage,
        lensContent: getComputedStyle(readoutElement, '::before').content,
      };
    });
    expect(materialStyles.housingBackgroundImage).not.toBe('none');
    expect(materialStyles.readoutBackgroundImage).not.toBe('none');
    expect(materialStyles.lensContent).not.toBe('none');

    await housing.screenshot({
      path: await evidencePath(
        testInfo,
        'time',
        `closed-${study.theme}-${study.width}x${study.height}`,
      ),
      animations: 'disabled',
    });

    await trigger.click();
    const picker = page.locator('[data-timezone-picker]');
    const input = page.getByRole('combobox', { name: 'Search time zones' });
    await expect(picker).toBeVisible();
    await expect(input).toBeFocused();
    await expectNoHorizontalOverflow(page);

    await housing.screenshot({
      path: await evidencePath(
        testInfo,
        'time',
        `open-${study.theme}-${study.width}x${study.height}`,
      ),
      animations: 'disabled',
    });
  });
}

async function prepareNavigationEvidence(
  page: Page,
  theme: 'light' | 'dark',
  width: number,
  height: number,
) {
  await page.setViewportSize({ width, height });
  await setTheme(page, theme);
  const response = await page.goto('/');
  expect(response?.ok()).toBe(true);
  await expect(page.locator('nav')).toBeVisible();
  await waitForClientHydration(page);
  await expect(page.locator('html')).toHaveClass(new RegExp(theme));
}

async function startNavigationState(page: Page) {
  const feedback = page.locator('[data-navigation-feedback]');
  await expect
    .poll(async () => {
      await page.evaluate(() => {
        window.dispatchEvent(
          new CustomEvent('scrapbook:navigation-start', {
            detail: { href: '/time', label: 'time' },
          }),
        );
      });
      return feedback.isVisible();
    })
    .toBe(true);
  return feedback;
}

async function captureNavigationTop(
  page: Page,
  testInfo: TestInfo,
  name: string,
  width: number,
) {
  await page.screenshot({
    path: await evidencePath(testInfo, 'navigation', name),
    animations: 'disabled',
    clip: { x: 0, y: 0, width, height: 104 },
  });
}

test('captures the ordinary progress rail', async ({ page }, testInfo) => {
  const width = 1366;
  await prepareNavigationEvidence(page, 'light', width, 768);
  const feedback = await startNavigationState(page);
  await expect(feedback).toHaveAttribute('data-navigation-state', 'running');
  await expectNoHorizontalOverflow(page);
  await captureNavigationTop(page, testInfo, 'ordinary-light-1366x768', width);
});

test('captures the progress rail on mobile', async ({ page }, testInfo) => {
  const width = 390;
  await prepareNavigationEvidence(page, 'dark', width, 844);
  const feedback = await startNavigationState(page);
  await expect(feedback).toHaveAttribute('data-navigation-state', 'running');
  await expectNoHorizontalOverflow(page);
  await captureNavigationTop(page, testInfo, 'ordinary-dark-390x844', width);
});

test('captures delayed slow navigation feedback', async ({ page }, testInfo) => {
  const width = 1366;
  await prepareNavigationEvidence(page, 'dark', width, 768);
  const feedback = await startNavigationState(page);
  await expect
    .poll(() => feedback.getAttribute('data-navigation-state'), { timeout: 5_500 })
    .toBe('slow');
  await expect(page.getByText('Still opening time…')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await captureNavigationTop(page, testInfo, 'slow-dark-1366x768', width);
});

test('captures actionable failure feedback', async ({ page }, testInfo) => {
  const width = 1366;
  await prepareNavigationEvidence(page, 'light', width, 768);
  const feedback = await startNavigationState(page);
  await page.evaluate(() => {
    window.dispatchEvent(
      new CustomEvent('scrapbook:navigation-error', {
        detail: { message: 'Navigation could not finish. Try the link again or reload this page.' },
      }),
    );
  });
  await expect(feedback).toHaveAttribute('data-navigation-state', 'failed');
  await expect(page.getByText(/Navigation could not finish/)).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await captureNavigationTop(page, testInfo, 'failure-light-1366x768', width);
});

test('removes the glass tint and picker blur for reduced transparency', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Chromium media emulation covers this fallback.');

  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }],
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/time');

  expect(
    await page.evaluate(() => window.matchMedia('(prefers-reduced-transparency: reduce)').matches),
  ).toBe(true);

  const readout = page.locator('[data-material-role="instrument-readout"]');
  const lensBackground = await readout.evaluate(
    (element) => getComputedStyle(element, '::before').backgroundImage,
  );
  expect(lensBackground).toBe('none');

  await page.locator('[data-timezone-trigger]').click();
  const picker = page.locator('[data-timezone-picker]');
  await expect(picker).toBeVisible();
  await expect(picker).toHaveCSS('backdrop-filter', 'none');
});

test('keeps time and navigation instruments legible in forced colours', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Forced-colour emulation is checked in Chromium.');

  await page.emulateMedia({ forcedColors: 'active' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/time');

  const forcedTimeStyles = await page.evaluate(() => {
    const housing = document.querySelector<HTMLElement>(
      '[data-material-role="instrument-housing"]',
    );
    const readout = document.querySelector<HTMLElement>(
      '[data-material-role="instrument-readout"]',
    );
    if (!housing || !readout) throw new Error('Missing time instrument');
    return {
      housingBackgroundImage: getComputedStyle(housing).backgroundImage,
      readoutBackgroundImage: getComputedStyle(readout).backgroundImage,
      lensBackgroundImage: getComputedStyle(readout, '::before').backgroundImage,
    };
  });
  expect(forcedTimeStyles.housingBackgroundImage).toBe('none');
  expect(forcedTimeStyles.readoutBackgroundImage).toBe('none');
  expect(forcedTimeStyles.lensBackgroundImage).toBe('none');

  await page.goto('/');
  await waitForClientHydration(page);
  await startNavigationState(page);
  const forcedNavigationStyles = await page.evaluate(() => {
    const rail = document.querySelector<HTMLElement>('.navigation-rail');
    const progress = document.querySelector<HTMLElement>('.navigation-progress');
    if (!rail || !progress) throw new Error('Missing navigation rail');
    return {
      railBackgroundImage: getComputedStyle(rail).backgroundImage,
      progressBackgroundImage: getComputedStyle(progress).backgroundImage,
      railHeight: rail.getBoundingClientRect().height,
    };
  });
  expect(forcedNavigationStyles.railBackgroundImage).toBe('none');
  expect(forcedNavigationStyles.progressBackgroundImage).toBe('none');
  expect(forcedNavigationStyles.railHeight).toBe(2);
  await expectNoHorizontalOverflow(page);
});
