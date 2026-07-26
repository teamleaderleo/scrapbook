import { expect, test, type Locator, type Page } from '@playwright/test';

type MobileScenario = {
  name: string;
  width: number;
  height: number;
  keyboardHeight: number;
  keyboardOffsetTop: number;
};

const portrait: MobileScenario = {
  name: 'portrait 390x844',
  width: 390,
  height: 844,
  keyboardHeight: 500,
  keyboardOffsetTop: 0,
};

const landscape: MobileScenario = {
  name: 'reduced-height landscape 740x390',
  width: 740,
  height: 390,
  keyboardHeight: 238,
  keyboardOffsetTop: 18,
};

async function installSyntheticVisualViewport(page: Page, scenario: MobileScenario) {
  await page.addInitScript(({ width, height }) => {
    class TestVisualViewport extends EventTarget {
      width = width;
      height = height;
      offsetTop = 0;
      offsetLeft = 0;
      pageTop = 0;
      pageLeft = 0;
      scale = 1;

      setGeometry(nextHeight: number, nextOffsetTop: number) {
        this.height = nextHeight;
        this.offsetTop = nextOffsetTop;
        this.dispatchEvent(new Event('resize'));
        this.dispatchEvent(new Event('scroll'));
      }
    }

    const viewport = new TestVisualViewport();
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: viewport,
    });
    (
      window as Window & {
        __setSpaceVisualViewport?: (nextHeight: number, nextOffsetTop: number) => void;
      }
    ).__setSpaceVisualViewport = (nextHeight, nextOffsetTop) =>
      viewport.setGeometry(nextHeight, nextOffsetTop);
  }, scenario);
}

async function setSyntheticVisualViewport(
  page: Page,
  height: number,
  offsetTop: number,
) {
  await page.evaluate(
    ({ nextHeight, nextOffsetTop }) => {
      const setter = (
        window as Window & {
          __setSpaceVisualViewport?: (height: number, top: number) => void;
        }
      ).__setSpaceVisualViewport;
      if (!setter) throw new Error('Missing synthetic Space visual viewport');
      setter(nextHeight, nextOffsetTop);
    },
    { nextHeight: height, nextOffsetTop: offsetTop },
  );
}

async function gotoMobile(page: Page, scenario: MobileScenario, path = '/space') {
  await page.setViewportSize({ width: scenario.width, height: scenario.height });
  await installSyntheticVisualViewport(page, scenario);
  await page.goto(path);
  await expect(page.getByRole('toolbar', { name: 'Space mobile actions' })).toBeVisible();
  await expect(page.getByText('Shortcut Alpha')).toBeVisible();
}

async function openEditor(page: Page) {
  const trigger = page.getByRole('button', { name: 'Open code editor' });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Code editor' });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.monaco-editor')).toBeVisible({ timeout: 30_000 });
  await expect
    .poll(() => page.evaluate(() => Boolean(history.state?.__spaceEditorSheet)))
    .toBe(true);
  return { trigger, dialog };
}

async function monacoInput(dialog: Locator) {
  const input = dialog.locator('textarea.inputarea');
  await expect(input).toBeVisible();
  await input.click();
  return input;
}

async function addScrollableSpace(page: Page) {
  return page.evaluate(() => {
    const region = document.querySelector<HTMLElement>('[data-space-scroll-region]');
    if (!region) throw new Error('Missing Space scroll region');
    const spacer = document.createElement('div');
    spacer.setAttribute('data-space-test-spacer', 'true');
    spacer.style.height = '1400px';
    spacer.style.minHeight = '1400px';
    spacer.style.flex = '0 0 1400px';
    region.appendChild(spacer);
    region.scrollTop = 240;
    return region.scrollTop;
  });
}

async function expectScroll(page: Page, expected: number) {
  await expect
    .poll(() =>
      page.evaluate((top) => {
        const region = document.querySelector<HTMLElement>('[data-space-scroll-region]');
        return region ? Math.abs(region.scrollTop - top) : Number.POSITIVE_INFINITY;
      }, expected),
    )
    .toBeLessThanOrEqual(2);
}

async function expectNoHorizontalOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
    )
    .toBeLessThanOrEqual(1);
}

test.describe('mobile Space actions', () => {
  test.use({ hasTouch: true });

  for (const scenario of [portrait, landscape]) {
    test(`${scenario.name} exposes registry actions and natural scrolling`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await gotoMobile(page, scenario);

      const toolbar = page.getByRole('toolbar', { name: 'Space mobile actions' });
      await expect(toolbar.getByRole('button', { name: 'Search items' })).toBeVisible();
      await expect(toolbar.getByRole('button', { name: 'Open review' })).toBeVisible();
      await expect(toolbar.getByRole('button', { name: 'Open code editor' })).toBeVisible();
      await expect(toolbar.getByRole('button', { name: 'Add item' })).toBeEnabled();

      const reducedMotion = await toolbar.evaluate((element) => {
        const style = getComputedStyle(element);
        return { property: style.transitionProperty, duration: style.transitionDuration };
      });
      expect(
        reducedMotion.property === 'none' ||
          reducedMotion.duration.split(',').every((duration) => duration.trim() === '0s'),
      ).toBe(true);

      await toolbar.getByRole('button', { name: 'Search items' }).click();
      const search = page.getByPlaceholder(/Search items/);
      await expect(search).toBeFocused();
      await search.fill('alpha');
      await expect(search).toHaveValue('alpha');
      await page.keyboard.press('Escape');
      await expect(search).toBeHidden();

      const scrollBefore = await addScrollableSpace(page);
      const region = page.locator('[data-space-scroll-region]').first();
      const box = await region.boundingBox();
      expect(box).toBeTruthy();
      await page.mouse.move(box!.x + box!.width / 2, Math.min(box!.y + 80, scenario.height - 120));
      await page.mouse.wheel(0, 320);
      await expect
        .poll(() =>
          page.evaluate(() =>
            document.querySelector<HTMLElement>('[data-space-scroll-region]')?.scrollTop ?? 0,
          ),
        )
        .toBeGreaterThan(scrollBefore);
      await expectNoHorizontalOverflow(page);
    });
  }
});

test.describe('mobile Space editor sheet', () => {
  test.use({ hasTouch: true });

  for (const scenario of [portrait, landscape]) {
    test(`${scenario.name} preserves review, Monaco selection, focus, scroll, and keyboard geometry`, async ({
      page,
    }) => {
      await gotoMobile(page, scenario, '/space/review');
      await page.keyboard.press('ArrowRight');
      await expect(page.locator('[data-space-current-item]')).toContainText('Shortcut Beta');
      await page.keyboard.press('Space');
      await expect(page.locator('[data-space-review-content]')).toHaveAttribute(
        'data-space-review-content',
        'hidden',
      );

      const savedScroll = await addScrollableSpace(page);
      const { trigger, dialog } = await openEditor(page);
      const input = await monacoInput(dialog);
      await page.keyboard.type('alpha');
      await page.keyboard.press('Shift+ArrowLeft');

      await setSyntheticVisualViewport(
        page,
        scenario.keyboardHeight,
        scenario.keyboardOffsetTop,
      );
      await expect
        .poll(() =>
          dialog.evaluate((element) => {
            const viewport = window.visualViewport;
            const rect = element.getBoundingClientRect();
            return {
              top: Math.abs(rect.top - (viewport?.offsetTop ?? 0)),
              bottom: Math.abs(rect.bottom - ((viewport?.offsetTop ?? 0) + (viewport?.height ?? 0))),
            };
          }),
        )
        .toEqual({ top: 0, bottom: 0 });

      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();
      await expect(page).toHaveURL(/\/space\/review(?:\?|$)/);
      await expect(page.locator('[data-space-current-item]')).toContainText('Shortcut Beta');
      await expect(page.locator('[data-space-review-content]')).toHaveAttribute(
        'data-space-review-content',
        'hidden',
      );
      await expectScroll(page, savedScroll);

      await setSyntheticVisualViewport(page, scenario.height, 0);
      const reopened = await openEditor(page);
      await monacoInput(reopened.dialog);
      await page.keyboard.type('X');
      await expect(reopened.dialog.locator('.view-lines')).toContainText('alphX');
      await reopened.dialog.getByRole('button', { name: 'Close code editor' }).click();
      await expect(reopened.dialog).toBeHidden();
      await expect(reopened.trigger).toBeFocused();
      await expectNoHorizontalOverflow(page);
    });
  }

  test('portrait browser back dismisses the sheet without losing the draft', async ({ page }) => {
    await gotoMobile(page, portrait);
    const { trigger, dialog } = await openEditor(page);
    await monacoInput(dialog);
    await page.keyboard.type('browser back draft');

    await page.goBack();
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/\/space$/);
    await expect(trigger).toBeFocused();

    const reopened = await openEditor(page);
    await expect(reopened.dialog.locator('.view-lines')).toContainText('browser back draft');
    await reopened.dialog.getByRole('button', { name: 'Close code editor' }).click();
    await expect(reopened.dialog).toBeHidden();
  });
});
