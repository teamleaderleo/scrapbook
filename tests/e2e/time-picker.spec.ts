import { expect, test, type Page } from '@playwright/test';

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

test.describe('mobile time picker', () => {
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
    await expect
      .poll(() =>
        page.evaluate((expected) => Math.abs(window.scrollY - expected), scrollBeforeOpen),
      )
      .toBeLessThanOrEqual(1);
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
    await expect
      .poll(() =>
        page.evaluate((expected) => Math.abs(window.scrollY - expected), scrollBeforeOpen),
      )
      .toBeLessThanOrEqual(1);
  });

  test('supports touch selection and keeps natural page scrolling', async ({ page }) => {
    const trigger = page.locator('[data-timezone-trigger]');
    await trigger.click();
    const input = page.getByRole('combobox', { name: 'Search time zones' });
    await input.fill('Tokyo');

    await page.locator('[cmdk-item]').filter({ hasText: 'Tokyo' }).click();
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
