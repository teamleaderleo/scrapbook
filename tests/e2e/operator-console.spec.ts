import { expect, test } from '@playwright/test';
import { operatorPhrases } from '../../lib/operator-phrases';

test('homepage leads with tactile operator phrases and keeps activity below', async ({
  context,
  page,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');

  const console = page.locator('[data-operator-console]');
  await expect(
    console.getByRole('heading', { name: 'What do you want them to do?' })
  ).toBeVisible();
  await expect(console.locator('[data-operator-phrase]')).toHaveCount(4);

  const phrase = operatorPhrases.find(item => item.id === 'go-do-stuff');
  if (!phrase) throw new Error('Missing go-do-stuff phrase');

  const button = console.locator('[data-operator-phrase="go-do-stuff"]');
  await button.click();
  await expect(button.getByText('Copied', { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(
    phrase.text
  );

  const operatorTop = await console.evaluate(element => element.getBoundingClientRect().top);
  const activityTop = await page
    .getByRole('heading', { name: 'GitHub, still here' })
    .evaluate(element => element.getBoundingClientRect().top);
  expect(operatorTop).toBeLessThan(activityTop);
});

test('full operator page exposes grouped phrases and the lazy one-link path', async ({
  page,
}) => {
  await page.goto('/operator');

  await expect(
    page.getByRole('heading', { name: 'Copy the nudge. Keep moving.' })
  ).toBeVisible();
  await page.getByRole('tab', { name: "I'm tired" }).click();

  const lazyPhrase = page.locator('[data-operator-phrase="read-operator-page"]');
  await expect(lazyPhrase).toBeVisible();
  await expect(lazyPhrase).toContainText('Bro, just read this');
  await expect(page.getByRole('link', { name: 'Plain text' })).toHaveAttribute(
    'href',
    '/operator.txt'
  );
});
