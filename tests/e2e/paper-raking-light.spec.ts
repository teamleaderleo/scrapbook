import { expect, test, type Page } from '@playwright/test';

function hydratedScoreboard(page: Page) {
  return page
    .locator('[data-activity-scoreboard]:visible')
    .filter({ hasText: /UTC reset \d{2}:\d{2}:\d{2}/ })
    .last();
}

async function boundingRect(locator: ReturnType<Page['locator']>) {
  return locator.evaluate(element => {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    };
  });
}

for (const theme of ['light', 'dark'] as const) {
  test(`paper scorecard stays calm under the pointer in ${theme} mode`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize({ width: 1280, height: 760 });
    await page.addInitScript(selectedTheme => {
      window.localStorage.setItem('theme', selectedTheme);
    }, theme);
    await page.goto('/');

    const scoreboard = hydratedScoreboard(page);
    await expect(scoreboard).toBeVisible({ timeout: 15_000 });
    await expect(scoreboard).toHaveAttribute('data-activity-motion', 'calm');

    for (const selector of [
      '[data-paper-raking-light]',
      '[data-paper-fibres]',
      '[data-paper-curl]',
    ]) {
      await expect(scoreboard.locator(selector)).toHaveCount(0);
    }

    const before = await boundingRect(scoreboard);
    await page.mouse.move(
      before.x + before.width * 0.15,
      before.y + before.height * 0.82
    );
    await page.mouse.move(
      before.x + before.width * 0.84,
      before.y + before.height * 0.2,
      { steps: 12 }
    );
    await page.waitForTimeout(350);
    const after = await boundingRect(scoreboard);

    expect(Math.abs(after.x - before.x)).toBeLessThan(1);
    expect(Math.abs(after.y - before.y)).toBeLessThan(1);
    expect(Math.abs(after.width - before.width)).toBeLessThan(1);
    expect(Math.abs(after.height - before.height)).toBeLessThan(1);
    expect(
      await scoreboard.evaluate(element => getComputedStyle(element).filter)
    ).toBe('none');
  });
}

test('reduced motion keeps the same planted scorecard contract', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const scoreboard = hydratedScoreboard(page);
  await expect(scoreboard).toBeVisible({ timeout: 15_000 });
  await expect(scoreboard).toHaveAttribute('data-activity-motion', 'reduced');
  await expect(scoreboard.locator('[data-paper-raking-light]')).toHaveCount(0);
});
