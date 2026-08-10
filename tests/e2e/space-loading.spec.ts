import { expect, test } from '@playwright/test';

for (const viewport of [
  { name: 'phone', width: 390, height: 844 },
  { name: 'desktop', width: 1280, height: 800 },
] as const) {
  test(`Space preserves viewport geometry while streaming on ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    const response = await page.goto('/space', { waitUntil: 'commit' });
    expect(response?.ok()).toBe(true);

    const streamedShell = await page.evaluate(() => {
      const element = document.querySelector('[data-space-loading-shell]');
      if (!(element instanceof HTMLElement)) return null;

      return {
        shellHeight: element.getBoundingClientRect().height,
        documentWidth: document.documentElement.scrollWidth,
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
      };
    });

    if (streamedShell) {
      expect(streamedShell.shellHeight).toBe(streamedShell.viewportHeight);
      expect(streamedShell.documentWidth).toBeLessThanOrEqual(
        streamedShell.viewportWidth
      );
    }

    await expect(page.getByRole('heading', { name: 'Space' })).toBeVisible({
      timeout: 15_000,
    });

    const settledGeometry = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    }));

    expect(settledGeometry.documentWidth).toBeLessThanOrEqual(
      settledGeometry.viewportWidth
    );
  });
}
