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
        __setSpaceVisualViewport?: (
          nextHeight: number,
          nextOffsetTop: number
        ) => void;
      }
    ).__setSpaceVisualViewport = (nextHeight, nextOffsetTop) =>
      viewport.setGeometry(nextHeight, nextOffsetTop);
  }, scenario);
}

async function setSyntheticVisualViewport(
  page: Page,
  height: number,
  offsetTop: number
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
    { nextHeight: height, nextOffsetTop: offsetTop }
  );
}

async function gotoMobile(page: Page, scenario: MobileScenario) {
  await page.setViewportSize({ width: scenario.width, height: scenario.height });
  await installSyntheticVisualViewport(page, scenario);
  const response = await page.goto('/space');
  expect(response?.ok()).toBe(true);

  // Hosted CI runs the Next development server. Its diagnostics portal is
  // outside product UI and can overlap the bottom-right action rail.
  await page.addStyleTag({
    content: 'nextjs-portal { pointer-events: none !important; }',
  });

  await expect(page.getByRole('heading', { name: 'Space' })).toBeVisible({
    timeout: 15_000,
  });
  await expect(
    page.getByRole('toolbar', { name: 'Space mobile actions' })
  ).toBeVisible();
}

async function openEditor(page: Page) {
  const trigger = page.getByRole('button', { name: 'Open code editor' });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Code editor' });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.monaco-editor')).toBeVisible({ timeout: 30_000 });
  return { trigger, dialog };
}

async function monacoInput(dialog: Locator) {
  const input = dialog.getByRole('textbox', { name: 'Editor content' });
  await expect(input).toBeVisible();
  await expect(input).toBeFocused({ timeout: 15_000 });
  return input;
}

async function addScrollableSpace(page: Page) {
  return page.evaluate(() => {
    const root = document.querySelector<HTMLElement>('[data-space-background]');
    if (!root) throw new Error('Missing Space background');

    const region = [root, ...root.querySelectorAll<HTMLElement>('*')].find(
      element => {
        const style = getComputedStyle(element);
        return /^(auto|scroll)$/.test(style.overflowY);
      }
    );
    if (!region) throw new Error('Missing Space scroll region');

    region.dataset.spaceTestScroll = 'true';
    const spacer = document.createElement('div');
    spacer.dataset.spaceTestSpacer = 'true';
    spacer.style.height = '1400px';
    spacer.style.minHeight = '1400px';
    region.appendChild(spacer);
    region.scrollTop = 240;
    return region.scrollTop;
  });
}

async function expectScroll(page: Page, expected: number) {
  await expect
    .poll(() =>
      page.evaluate((top) => {
        const region = document.querySelector<HTMLElement>(
          '[data-space-test-scroll="true"]'
        );
        return region ? Math.abs(region.scrollTop - top) : Number.POSITIVE_INFINITY;
      }, expected)
    )
    .toBeLessThanOrEqual(2);
}

async function expectNoHorizontalOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth
      )
    )
    .toBeLessThanOrEqual(1);
}

test.describe('mobile Space actions', () => {
  test.use({ hasTouch: true });

  for (const scenario of [portrait, landscape]) {
    test(`${scenario.name} exposes current registry actions without overflow`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await gotoMobile(page, scenario);

      const toolbar = page.getByRole('toolbar', { name: 'Space mobile actions' });
      await expect(toolbar.getByRole('button', { name: 'Search items' })).toBeVisible();
      await expect(toolbar.getByRole('button', { name: 'Open reader' })).toBeVisible();
      await expect(
        toolbar.getByRole('button', { name: 'Open code editor' })
      ).toBeVisible();
      await expect(toolbar.getByRole('button', { name: 'Add item' })).toBeDisabled();

      await toolbar.getByRole('button', { name: 'Search items' }).click();
      const search = page.getByPlaceholder(/Search items/);
      await expect(search).toBeFocused();
      await search.fill('boundary');
      await expect(search).toHaveValue('boundary');
      await page.keyboard.press('Escape');
      await expect(search).toBeHidden();

      await expectNoHorizontalOverflow(page);
    });
  }
});

test.describe('mobile Space editor sheet', () => {
  test.use({ hasTouch: true });

  for (const scenario of [portrait, landscape]) {
    test(`${scenario.name} keeps the Monaco draft, viewport, focus, and scroll across dismissal`, async ({
      page,
    }) => {
      await gotoMobile(page, scenario);
      const savedScroll = await addScrollableSpace(page);
      const { trigger, dialog } = await openEditor(page);
      await monacoInput(dialog);
      await page.keyboard.type('alpha');
      await page.keyboard.press('Shift+ArrowLeft');

      await setSyntheticVisualViewport(
        page,
        scenario.keyboardHeight,
        scenario.keyboardOffsetTop
      );
      await expect
        .poll(() =>
          dialog.evaluate(element => {
            const viewport = window.visualViewport;
            const rect = element.getBoundingClientRect();
            return {
              top: Math.round(
                Math.abs(rect.top - (viewport?.offsetTop ?? 0))
              ),
              bottom: Math.round(
                Math.abs(
                  rect.bottom -
                    ((viewport?.offsetTop ?? 0) + (viewport?.height ?? 0))
                )
              ),
            };
          })
        )
        .toEqual({ top: 0, bottom: 0 });

      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();
      await expect(page).toHaveURL(/\/space$/);
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
});
