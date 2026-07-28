import { expect, test, type Page } from '@playwright/test';

async function waitForSiteNav(page: Page) {
  const nav = page.locator('[data-site-nav]');
  await expect(nav).toHaveAttribute('data-site-nav-ready', 'true');
  return nav;
}

test('the bordered site nav is exactly 48px at desktop and phone widths', async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/journal');
    const nav = await waitForSiteNav(page);

    const geometry = await nav.evaluate((element) => {
      const firstWrapper = element.firstElementChild;
      const row = firstWrapper?.firstElementChild;
      const style = getComputedStyle(element);
      return {
        outer: element.getBoundingClientRect().height,
        borderBottom: Number.parseFloat(style.borderBottomWidth),
        wrapper: firstWrapper?.getBoundingClientRect().height ?? 0,
        row: row?.getBoundingClientRect().height ?? 0,
      };
    });

    expect(geometry.outer).toBe(48);
    expect(geometry.borderBottom).toBe(1);
    expect(geometry.wrapper).toBe(geometry.outer - geometry.borderBottom);
    expect(geometry.row).toBe(geometry.outer - geometry.borderBottom);
  }
});

test('opening and closing the Atlas keeps shell geometry stable', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 760 });
  await page.goto('/journal');
  await waitForSiteNav(page);

  const trigger = page.locator('[data-site-atlas-trigger]');
  await expect(trigger).toBeVisible();

  const shellGeometry = () =>
    page.evaluate(() => {
      const triggerElement = document.querySelector<HTMLElement>('[data-site-atlas-trigger]');
      const nav = document.querySelector<HTMLElement>('[data-site-nav]');
      if (!triggerElement || !nav) throw new Error('Missing Atlas shell geometry');
      return {
        triggerRight: triggerElement.getBoundingClientRect().right,
        navLeft: nav.getBoundingClientRect().left,
        navWidth: nav.getBoundingClientRect().width,
      };
    });

  const before = await shellGeometry();
  await trigger.click();
  await expect(page.locator('[data-site-atlas]')).toBeVisible();

  const open = await shellGeometry();
  const compensation = await page.evaluate(() =>
    getComputedStyle(document.body).getPropertyValue('--removed-body-scroll-bar-size').trim(),
  );

  expect(Math.abs(open.triggerRight - before.triggerRight)).toBeLessThan(1);
  expect(Math.abs(open.navLeft - before.navLeft)).toBeLessThan(1);
  expect(Math.abs(open.navWidth - before.navWidth)).toBeLessThan(1);
  expect(compensation).toBe('0px');

  await page.keyboard.press('Escape');
  await expect(page.locator('[data-site-atlas]')).toBeHidden();
  const closed = await shellGeometry();
  expect(Math.abs(closed.triggerRight - before.triggerRight)).toBeLessThan(1);
  expect(Math.abs(closed.navLeft - before.navLeft)).toBeLessThan(1);
  expect(Math.abs(closed.navWidth - before.navWidth)).toBeLessThan(1);
});
