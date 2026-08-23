import { expect, test } from '@playwright/test';

test('Space exposes four stable entry lanes', async ({ page }) => {
  const response = await page.goto('/space');
  expect(response?.ok()).toBe(true);

  const lanes = page.getByRole('navigation', { name: 'Space sections' });
  await expect(lanes).toBeVisible({ timeout: 15_000 });

  const expected = [
    ['open', 'Open'],
    ['fieldwork', 'From Fieldwork'],
    ['scales', 'Scales'],
    ['archive', 'Archive'],
  ] as const;

  for (const [id, label] of expected) {
    const link = lanes.getByRole('link', { name: new RegExp(`^${label}`) });
    await expect(link).toHaveAttribute('href', `/space?lane=${id}`);
  }

  await expect(page.locator('[data-space-lane="open"]')).toHaveAttribute(
    'aria-current',
    'page'
  );

  await page.locator('[data-space-lane="scales"]').click();
  await expect(page).toHaveURL(/\/space\?lane=scales$/);
  await expect(page.locator('[data-space-lane="scales"]')).toHaveAttribute(
    'aria-current',
    'page'
  );
});

test('a direct item filter uses the complete archive by default', async ({
  page,
}) => {
  await page.goto('/space?tags=leetcode');

  await expect(page.locator('[data-space-lane="archive"]')).toHaveAttribute(
    'aria-current',
    'page',
    { timeout: 15_000 }
  );
});

test('Space lanes stay contained on a phone viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/space');
  await expect(page.locator('[data-space-lanes]')).toBeVisible({
    timeout: 15_000,
  });

  const footprint = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    laneHeight: document
      .querySelector<HTMLElement>('[data-space-lane="open"]')
      ?.getBoundingClientRect().height,
  }));

  expect(footprint.documentWidth).toBeLessThanOrEqual(footprint.viewportWidth);
  expect(footprint.laneHeight).toBeGreaterThanOrEqual(100);
});
