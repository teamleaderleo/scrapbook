import { expect, test } from '@playwright/test';

test('opens the snow globe from the site atlas', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.ok()).toBe(true);

  await page.locator('[data-site-atlas-trigger]').click();
  const link = page.locator('[data-site-atlas-link="snow-globe"]');
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', '/snow-globe');
  await link.click();

  await expect(page).toHaveURL(/\/snow-globe$/);
  await expect(
    page.getByRole('heading', { name: 'Snow globe', level: 1 })
  ).toBeVisible();
  await expect(page.locator('[data-snow-globe-stage]')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Rattle the globe' })
  ).toBeVisible();
});

test('renders an automatic dimensional scene with a deliberate rattle control', async ({
  page,
}) => {
  const response = await page.goto('/snow-globe');
  expect(response?.ok()).toBe(true);

  const stage = page.locator('[data-snow-globe-stage]');
  await expect(stage.locator('canvas')).toBeVisible();
  await expect(stage.locator('[data-snow-globe-scene]')).toHaveAttribute(
    'aria-label',
    /A-frame reading cabin.*frozen pond/i
  );
  await expect(stage).not.toContainText('Winter reading room');
  await expect(stage).not.toContainText(
    'The cabin slowly turns through the glass.'
  );
  await expect(stage).not.toContainText('Auto turning');
  await page.getByRole('button', { name: 'Rattle the globe' }).click();
});
