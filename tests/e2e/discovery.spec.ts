import { expect, test } from '@playwright/test';

test('Workbench filters survive an article visit and Back', async ({
  page,
}) => {
  await page.goto('/desk');
  await page.getByRole('searchbox', { name: 'Search writing' }).fill('virtual');
  await expect(page.getByRole('status')).toHaveText('2 pieces · newest first');
  await page
    .getByRole('combobox', { name: 'Writing type' })
    .selectOption('Essay');
  await page
    .getByRole('link', { name: 'The Guest Gets the Territory', exact: true })
    .click();
  await expect(
    page.getByRole('heading', {
      name: 'The Guest Gets the Territory',
      level: 1,
    })
  ).toBeVisible();
  await page.goBack();
  await expect(
    page.getByRole('searchbox', { name: 'Search writing' })
  ).toHaveValue('virtual');
  await expect(
    page.getByRole('combobox', { name: 'Writing type' })
  ).toHaveValue('Essay');
  await expect(page.getByRole('status')).toHaveText('2 pieces · newest first');
  await page.reload();
  await expect(page.getByRole('status')).toHaveText('2 pieces · newest first');
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.getByRole('status')).toHaveText('32 pieces · newest first');
});

test('shared search supports keyboard focus, collections, recent items, and clearing history', async ({
  page,
}) => {
  await page.goto('/desk');
  const trigger = page.getByRole('button', {
    name: 'Search Scrapbook',
    exact: true,
  });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Search Scrapbook' });
  const search = dialog.getByRole('searchbox');
  await expect(search).toBeFocused();
  await search.fill('virtual');
  await expect(
    dialog
      .getByRole('link')
      .filter({ hasText: 'Virtual machines as authority' })
  ).toBeVisible();
  await dialog.getByRole('combobox').selectOption('Workbench');
  await expect(dialog.getByRole('link')).toHaveCount(2);
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await trigger.click();
  await dialog
    .getByRole('link')
    .filter({ hasText: 'The Guest Gets the Territory' })
    .click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'The Guest Gets the Territory'
  );
  await page.getByRole('link', { name: 'teamleaderleo', exact: true }).click();
  const recent = page.getByRole('region', { name: 'Recently opened' });
  await expect(
    recent.getByRole('link', { name: /The Guest Gets the Territory/ })
  ).toBeVisible();
  await page.reload();
  await expect(
    recent.getByRole('link', { name: /The Guest Gets the Territory/ })
  ).toBeVisible();
  await recent.getByRole('button', { name: 'Clear history' }).click();
  await expect(recent).toBeHidden();
  await page.reload();
  await expect(recent).toBeHidden();
});

test('Knowledge is searchable with compact reading notes and reciprocal related links', async ({
  page,
}) => {
  await page.goto('/knowledge');
  await page
    .getByRole('searchbox', { name: 'Search concepts' })
    .fill('virtual');
  await expect(page.getByRole('status')).toHaveText('1 concept');
  await expect(page.locator('details')).not.toHaveAttribute('open');
  await page
    .getByRole('region', { name: 'Concept browser' })
    .getByRole('link', {
      name: 'Virtual machines as authority over real resources',
    })
    .click();
  await expect(
    page.locator('[data-scrapbook-related]').getByRole('link')
  ).toHaveAttribute('href', '/desk/the-guest-gets-the-territory');
});

test('mobile browse controls and search remain inside the viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/desk');
  await expect(
    page.getByRole('searchbox', { name: 'Search writing' })
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true);
  expect(
    (
      await page
        .getByRole('searchbox', { name: 'Search writing' })
        .boundingBox()
    )?.height
  ).toBeGreaterThanOrEqual(44);
  await page.screenshot({
    path: '/tmp/scrapbook-discovery-mobile.png',
    animations: 'disabled',
  });
  await page
    .getByRole('button', { name: 'Search Scrapbook', exact: true })
    .click();
  const dialog = page.getByRole('dialog', { name: 'Search Scrapbook' });
  await dialog.getByRole('searchbox').fill('virtual');
  await expect(dialog.getByRole('link').first()).toBeVisible();
  const box = await dialog.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(844);
  await page.screenshot({
    path: '/tmp/scrapbook-discovery-search-mobile.png',
    animations: 'disabled',
  });
});

test('shared search can retry a failed index request and opens by keyboard in Space', async ({
  page,
}) => {
  let attempts = 0;
  await page.route('**/api/site-search', async route => {
    attempts += 1;
    if (attempts === 1) await route.fulfill({ status: 503, body: '{}' });
    else await route.continue();
  });
  await page.goto('/knowledge');
  await expect(page.locator('[data-site-nav-ready="true"]')).toBeVisible();
  await page.keyboard.press('Control+k');
  const dialog = page.getByRole('dialog', { name: 'Search Scrapbook' });
  await expect(dialog.getByRole('status')).toHaveText('Search unavailable');
  await dialog.getByRole('button', { name: 'Retry' }).click();
  await dialog.getByRole('searchbox').fill('Air Blue');
  await expect(
    dialog.getByRole('link').filter({ hasText: 'Machine health' })
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('link', { name: 'Space', exact: true }).click();
  await expect(page).toHaveURL(/\/space$/);
  await page.keyboard.press('Control+Shift+k');
  await expect(dialog.getByRole('searchbox')).toBeFocused();
  await dialog.getByRole('searchbox').fill('virtual');
  await expect(dialog.getByRole('link').first()).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await page.getByRole('button', { name: 'Search items', exact: true }).click();
  const localSearch = page.getByRole('dialog', { name: 'Search Command' });
  await expect(localSearch).toBeVisible();
  await localSearch
    .getByRole('option', { name: 'Search all Scrapbook', exact: true })
    .click();
  await expect(dialog.getByRole('searchbox')).toBeFocused();
  await expect(localSearch).toBeHidden();
});
