import { expect, test } from '@playwright/test';
import { operatorPhrases } from '../../lib/operator-phrases';

test('homepage keeps operator phrases compact and activity close at hand', async ({
  context,
  page,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const console = page.locator('[data-operator-console]');
  await expect(
    console.getByRole('heading', { name: 'Operator phrases' })
  ).toBeVisible();
  await expect(console.locator('[data-operator-phrase]')).toHaveCount(4);

  const phrase = operatorPhrases.find(item => item.id === 'go-do-stuff');
  if (!phrase) throw new Error('Missing go-do-stuff phrase');

  const button = console.locator('[data-operator-phrase="go-do-stuff"]');
  await button.click();
  await expect(button).toHaveAttribute('data-copy-state', 'copied');
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(phrase.text);

  const operatorTop = await console.evaluate(
    element => element.getBoundingClientRect().top
  );
  const operatorHeight = await console.evaluate(
    element => element.getBoundingClientRect().height
  );
  const activityTop = await page
    .locator('#home-activity-title')
    .evaluate(element => element.getBoundingClientRect().top);
  expect(operatorTop).toBeLessThan(activityTop);
  expect(operatorHeight).toBeLessThanOrEqual(390);
  expect(activityTop).toBeLessThan(520);
});

test('full operator page exposes grouped phrases and the lazy one-link path', async ({
  page,
}) => {
  await page.goto('/operator');

  await expect(
    page.getByRole('heading', { name: 'Copy the nudge. Keep moving.' })
  ).toBeVisible();
  await page.getByRole('tab', { name: "I'm tired" }).click();

  const lazyPhrase = page.locator(
    '[data-operator-phrase="read-operator-page"]'
  );
  await expect(lazyPhrase).toBeVisible();
  await expect(lazyPhrase).toContainText('Bro, just read this');
  await expect(page.getByRole('link', { name: 'Plain text' })).toHaveAttribute(
    'href',
    '/operator.txt'
  );
});

test('operator phrase hashes reveal the referenced section directly', async ({
  page,
}) => {
  await page.goto('/operator#perspective-pass');

  await expect(page.getByRole('tab', { name: 'Review' })).toHaveAttribute(
    'aria-selected',
    'true'
  );
  await expect(
    page.locator('[data-operator-phrase="perspective-pass"]')
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Link to Perspective pass' })
  ).toHaveAttribute('href', '/operator#perspective-pass');

  await page.getByRole('tab', { name: 'Steer' }).click();
  await expect(page).toHaveURL(/\/operator$/);
  await expect(
    page.locator('[data-operator-phrase="think-sideways"]')
  ).toBeVisible();
});
