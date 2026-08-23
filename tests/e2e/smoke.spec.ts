import { expect, test, type Page } from '@playwright/test';

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
  }));

  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
}

test('core public routes answer', async ({ page }) => {
  for (const route of ['/', '/time', '/gallery', '/atelier']) {
    const response = await page.goto(route);
    expect(response?.ok(), route).toBe(true);
    await expect(page.locator('body')).toBeVisible();
  }
});

test('homepage hydrates and stays bounded on desktop and mobile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');

  const timeLink = page.getByRole('link', { name: /Open the time converter/i });
  await expect
    .poll(() => timeLink.getAttribute('aria-label'))
    .not.toContain('Local time --:--');
  await expectNoHorizontalOverflow(page);

  await page.setViewportSize({ width: 390, height: 844 });
  await expectNoHorizontalOverflow(page);
});

test('mobile navigation opens after hydration', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const nav = page.locator('[data-site-nav]');
  await expect(nav).toHaveAttribute('data-site-nav-ready', 'true');
  await page.locator('[data-site-atlas-trigger]').click();
  await expect(page.locator('[data-site-atlas]')).toBeVisible();
});
