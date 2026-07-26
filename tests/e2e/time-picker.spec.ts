import { expect, test, type Page } from '@playwright/test';

type MobileViewportScenario = {
  name: string;
  width: number;
  height: number;
  keyboardHeight: number;
};

const portrait: MobileViewportScenario = {
  name: 'mobile portrait',
  width: 390,
  height: 844,
  keyboardHeight: 520,
};

const landscape: MobileViewportScenario = {
  name: 'reduced-height landscape',
  width: 740,
  height: 390,
  keyboardHeight: 246,
};

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

async function prepareDocumentScroll(page: Page, selector: string) {
  await page.locator(selector).scrollIntoViewIfNeeded();
  return page.evaluate(() => {
    const element = document.scrollingElement;
    if (!element) throw new Error('Missing document scrolling element');
    const max = element.scrollHeight - element.clientHeight;
    if (element.scrollTop >= max - 8) element.scrollTop = Math.max(0, max - 160);
    return { top: element.scrollTop, max };
  });
}

async function installSyntheticVisualViewport(page: Page, height: number) {
  await page.addInitScript((initialHeight) => {
    class TestVisualViewport extends EventTarget {
      height = initialHeight;
      width = window.innerWidth;
      offsetTop = 0;
      offsetLeft = 0;
      pageTop = 0;
      pageLeft = 0;
      scale = 1;

      setHeight(nextHeight: number) {
        this.height = nextHeight;
        this.dispatchEvent(new Event('resize'));
      }
    }

    const viewport = new TestVisualViewport();
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: viewport,
    });
    (
      window as Window & {
        __setTestVisualViewportHeight?: (nextHeight: number) => void;
      }
    ).__setTestVisualViewportHeight = (nextHeight) => viewport.setHeight(nextHeight);
  }, height);
}

async function setSyntheticVisualViewportHeight(page: Page, height: number) {
  await page.evaluate((nextHeight) => {
    const setter = (
      window as Window & {
        __setTestVisualViewportHeight?: (value: number) => void;
      }
    ).__setTestVisualViewportHeight;
    if (!setter) throw new Error('Missing synthetic visual viewport');
    setter(nextHeight);
  }, height);
}

async function gotoWithSyntheticViewport(page: Page, scenario: MobileViewportScenario) {
  await page.setViewportSize({ width: scenario.width, height: scenario.height });
  await installSyntheticVisualViewport(page, scenario.height);
  await page.goto('/time');
}

async function savedScrollBeforeOpen(page: Page) {
  const trigger = page.locator('[data-timezone-trigger]');
  await trigger.scrollIntoViewIfNeeded();
  const savedScroll = await page.evaluate(() => window.scrollY);
  await trigger.click();
  await expect(page.getByRole('combobox', { name: 'Search time zones' })).toBeFocused();
  return { trigger, savedScroll };
}

async function expectSavedScroll(page: Page, savedScroll: number) {
  await expect
    .poll(() => page.evaluate((expected) => Math.abs(window.scrollY - expected), savedScroll))
    .toBeLessThanOrEqual(2);
}

test.describe('mobile time picker', () => {
  test.use({ hasTouch: true });

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/time');
  });

  test('uses the visual viewport and restores focus and scroll on dismissal', async ({ page }) => {
    const trigger = page.locator('[data-timezone-trigger]');
    await trigger.scrollIntoViewIfNeeded();
    const scrollBeforeOpen = await page.evaluate(() => window.scrollY);

    await trigger.click();
    const input = page.getByRole('combobox', { name: 'Search time zones' });
    const picker = page.locator('[data-timezone-picker]');

    await expect(input).toBeFocused();
    await expect(picker).toBeVisible();

    await page.setViewportSize({ width: 390, height: 520 });

    await expect
      .poll(() =>
        page.evaluate(() => {
          const list = document.querySelector<HTMLElement>('[data-timezone-results]');
          const viewport = window.visualViewport;
          if (!list) return Number.POSITIVE_INFINITY;
          const viewportBottom = viewport
            ? viewport.offsetTop + viewport.height
            : window.innerHeight;
          return Math.ceil(list.getBoundingClientRect().bottom - viewportBottom);
        }),
      )
      .toBeLessThanOrEqual(1);

    const geometry = await page.evaluate(() => {
      const selected = document.querySelector<HTMLElement>('[data-selected-time-readout]');
      const viewport = window.visualViewport;
      if (!selected) throw new Error('Missing selected-time readout');
      return {
        readoutTop: selected.getBoundingClientRect().top,
        viewportTop: viewport?.offsetTop ?? 0,
      };
    });
    expect(geometry.readoutTop).toBeGreaterThanOrEqual(geometry.viewportTop - 1);

    await input.press('Escape');
    await expect(picker).toBeHidden();
    await expect(trigger).toBeFocused();
    await expectSavedScroll(page, scrollBeforeOpen);
    await expectNoHorizontalOverflow(page);
  });

  test('supports keyboard preview and selection without moving the page', async ({ page }) => {
    const trigger = page.locator('[data-timezone-trigger]');
    await trigger.scrollIntoViewIfNeeded();
    const scrollBeforeOpen = await page.evaluate(() => window.scrollY);
    await trigger.click();
    const input = page.getByRole('combobox', { name: 'Search time zones' });
    const readout = page.locator('[data-selected-time-readout]');

    await input.fill('Singapore');
    await input.press('ArrowDown');
    await expect(readout).toContainText('Preview time');
    await expect(readout).toContainText('Singapore');
    await input.press('Enter');

    await expect(readout).toContainText('Selected time');
    await expect(readout).toContainText('Singapore');
    await expect(readout).toContainText('SGT');
    await expect(trigger).toBeFocused();
    await expect(page.locator('[data-timezone-picker]')).toBeHidden();
    await expectSavedScroll(page, scrollBeforeOpen);
  });

  test('supports touch selection and keeps natural page scrolling', async ({ page }) => {
    const trigger = page.locator('[data-timezone-trigger]');
    await trigger.tap();
    const input = page.getByRole('combobox', { name: 'Search time zones' });
    await input.fill('Tokyo');

    await page.locator('[cmdk-item]').filter({ hasText: 'Tokyo' }).tap();
    await expect(page.locator('[data-selected-time-readout]')).toContainText('Tokyo');
    await expect(trigger).toBeFocused();

    const slider = page.locator('input[type="range"]');
    const scrollState = await prepareDocumentScroll(page, 'input[type="range"]');
    expect(scrollState.max).toBeGreaterThan(0);
    const box = await slider.boundingBox();
    expect(box).toBeTruthy();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.wheel(0, 260);

    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(scrollState.top);
    await expectNoHorizontalOverflow(page);
  });
});

test.describe('delayed mobile keyboard dismissal', () => {
  test.use({ hasTouch: true });

  test(`${portrait.name} waits for delayed viewport expansion after Escape`, async ({ page }) => {
    await gotoWithSyntheticViewport(page, portrait);
    const { trigger, savedScroll } = await savedScrollBeforeOpen(page);
    const input = page.getByRole('combobox', { name: 'Search time zones' });
    const readout = page.locator('[data-selected-time-readout]');

    await setSyntheticVisualViewportHeight(page, portrait.keyboardHeight);
    await input.press('Escape');

    await expect(page.locator('[data-timezone-picker]')).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(readout).toBeVisible();

    await setSyntheticVisualViewportHeight(page, portrait.height);
    await expectSavedScroll(page, savedScroll);
    await expectNoHorizontalOverflow(page);
  });

  test(`${landscape.name} waits for delayed viewport expansion after touch selection`, async ({
    page,
  }) => {
    await gotoWithSyntheticViewport(page, landscape);
    const { trigger, savedScroll } = await savedScrollBeforeOpen(page);
    const input = page.getByRole('combobox', { name: 'Search time zones' });
    const readout = page.locator('[data-selected-time-readout]');

    await setSyntheticVisualViewportHeight(page, landscape.keyboardHeight);
    await input.fill('Tokyo');
    const tokyoOption = page.locator('[cmdk-item]').filter({ hasText: 'Tokyo' });
    await expect(tokyoOption).toBeVisible();
    // The synthetic visual viewport changes scheduler geometry without changing native
    // hit testing, so send the touch pointer sequence directly to the selected option.
    await tokyoOption.dispatchEvent('pointerdown', { pointerType: 'touch', isPrimary: true });
    await tokyoOption.dispatchEvent('pointerup', { pointerType: 'touch', isPrimary: true });
    await tokyoOption.dispatchEvent('click', { detail: 1 });

    await expect(page.locator('[data-timezone-picker]')).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(readout).toContainText('Tokyo');
    await expect(readout).toBeVisible();

    await setSyntheticVisualViewportHeight(page, landscape.height);
    await expectSavedScroll(page, savedScroll);
    await expectNoHorizontalOverflow(page);
  });
});
