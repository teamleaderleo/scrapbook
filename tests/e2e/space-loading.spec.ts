import { expect, test } from '@playwright/test';

for (const viewport of [
  { name: 'phone', width: 390, height: 844 },
  { name: 'desktop', width: 1280, height: 800 },
] as const) {
  test(`Space loading shell preserves the desk geometry on ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto('/space', { waitUntil: 'commit' });

    const shell = page.locator('[data-space-loading-shell]');
    await expect(shell).toBeVisible();
    await page.waitForFunction(() => {
      const element = document.querySelector('[data-space-loading-shell]');
      return element && getComputedStyle(element).display === 'flex';
    });
    await expect(shell.locator('[data-space-loading-lane]')).toHaveCount(4);
    await expect(shell.locator('[data-space-loading-row]')).toHaveCount(5);

    const geometry = await shell.evaluate(element => ({
      shellHeight: element.getBoundingClientRect().height,
      documentWidth: document.documentElement.scrollWidth,
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth,
      skeletonCount: element.querySelectorAll('[data-skeleton]').length,
    }));

    expect(geometry.shellHeight).toBe(geometry.viewportHeight);
    expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewportWidth);
    expect(geometry.skeletonCount).toBeGreaterThanOrEqual(20);
  });
}
