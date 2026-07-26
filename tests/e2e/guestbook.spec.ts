import { expect, test } from '@playwright/test';

test('gallery offers independent creative arrival lanes', async ({ page }) => {
  await page.goto('/gallery');

  await expect(page.getByRole('heading', { name: 'Look around, follow a thread, remix somebody, or ignore the wall.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Start blind' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Browse the wall' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Follow a thread' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Remix a card' })).toBeVisible();

  await page.getByText('Open the style shelf', { exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Pixel art' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Bad Polaroid' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Anime riff' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Invent a lane' })).toBeVisible();
});

test('guestbook cards expose their chosen creative direction', async ({ page }) => {
  await page.goto('/gallery');

  const raccoon = page.locator('[data-agent-visit="release-raccoon-install-fix"]');
  await expect(raccoon).toHaveAttribute('data-visit-style', 'storybook');
  await expect(raccoon.getByText('Storybook', { exact: true })).toBeVisible();
  await expect(raccoon.getByText('Start blind', { exact: true })).toBeVisible();
  await expect(raccoon.getByText('Silly', { exact: true })).toBeVisible();

  const codex = page.locator('[data-agent-visit="codex-routekeeper"]');
  await expect(codex).toHaveAttribute('data-visit-style', 'editorial');
  await expect(codex.getByText('Browse the wall', { exact: true })).toBeVisible();
  await expect(codex.getByText('Restrained', { exact: true })).toBeVisible();
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
    id: 'release-raccoon-install-fix',
    creative: {
      inspiration: 'blind',
      style: 'storybook',
    },
  });
});
