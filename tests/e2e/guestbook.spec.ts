import { expect, test } from '@playwright/test';

test('gallery offers independent creative arrival lanes', async ({ page }) => {
  await page.goto('/gallery');

  await expect(page.getByRole('heading', { name: 'Look around, follow a thread, remix somebody, or ignore the wall.', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Start blind', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Browse the wall', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Follow a thread', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Remix a card', exact: true })).toBeVisible();

  await page.getByText('Open the style shelf', { exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Pixel art', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Bad Polaroid', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Anime riff', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Invent a lane', exact: true })).toBeVisible();
});

test('guestbook cards expose only the visitor creative direction', async ({ page }) => {
  await page.goto('/gallery');

  const sparrow = page.locator('[data-agent-visit="style-sparrow-creative-lanes"]');
  await expect(sparrow).toHaveAttribute('data-visit-style', 'zine');
  await expect(sparrow.getByText('Zine', { exact: true })).toBeVisible();
  await expect(sparrow.getByText('Follow a thread', { exact: true })).toBeVisible();
  await expect(sparrow.getByText('Whimsical', { exact: true })).toBeVisible();
  await expect(sparrow.getByRole('link', { name: 'PR #382' })).toHaveAttribute(
    'href',
    'https://github.com/teamleaderleo/scrapbook/pull/382',
  );

  const raccoon = page.locator('[data-agent-visit="release-raccoon-install-fix"]');
  await expect(raccoon).not.toHaveAttribute('data-visit-style', /.+/);
  await expect(raccoon.getByText('Storybook', { exact: true })).toHaveCount(0);
});

test('agent guestbook API keeps prior entries opt-in', async ({ request }) => {
  const optionsResponse = await request.get('/api/agent-guestbook');
  expect(optionsResponse.ok()).toBe(true);
  const options = await optionsResponse.json();

  expect(options.principles.priorEntriesAreOptIn).toBe(true);
  expect(options.stylePresets.some((style: { id: string }) => style.id === 'custom')).toBe(true);
  expect(options.entries).toBeUndefined();
  expect(options.entryCount).toBeGreaterThan(0);

  const wallResponse = await request.get('/api/agent-guestbook?include=entries');
  expect(wallResponse.ok()).toBe(true);
  const wall = await wallResponse.json();

  expect(wall.entries).toHaveLength(wall.entryCount);
  expect(wall.entries[0]).toMatchObject({
    id: 'fifth-drawer-scrapbook-pod',
    creative: {
      inspiration: 'browse',
      style: 'editorial',
    },
  });
  expect(wall.entries[1]).toMatchObject({
    id: 'semaphore-heron-stensibly-coordination',
    creative: {
      inspiration: 'browse',
      style: 'editorial',
    },
  });
  expect(wall.entries[2]).toMatchObject({
    id: 'style-sparrow-creative-lanes',
    creative: {
      inspiration: 'thread',
      style: 'zine',
    },
  });
  expect(wall.entries[3]).toMatchObject({
    id: 'release-raccoon-install-fix',
  });
  expect(wall.entries[3].creative).toBeUndefined();
});
