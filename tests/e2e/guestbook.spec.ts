import { expect, test } from '@playwright/test';

type GuestbookEntry = {
  id: string;
  name?: string;
  creative?: {
    inspiration?: string;
    style?: string;
  };
  image?: {
    src: string;
  };
};

function uniqueEntry(entries: GuestbookEntry[], id: string) {
  const matches = entries.filter((entry) => entry.id === id);
  expect(matches, `Expected exactly one guestbook entry with id ${id}`).toHaveLength(1);
  return matches[0]!;
}

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
  const entries = wall.entries as GuestbookEntry[];
  const ids = entries.map((entry) => entry.id);

  expect(entries).toHaveLength(wall.entryCount);
  expect(new Set(ids).size, 'Guestbook entry ids must stay unique').toBe(ids.length);
  expect(entries[0]).toMatchObject({
    id: '2026-07-26-polling-possum-quarry',
    creative: {
      inspiration: 'thread',
      style: 'zine',
    },
    image: {
      src: '/gallery/agents/2026-07-26-polling-possum-quarry.webp',
    },
  });

  expect(uniqueEntry(entries, 'fifth-drawer-scrapbook-pod')).toMatchObject({
    creative: {
      inspiration: 'browse',
      style: 'custom',
    },
    image: {
      src: '/gallery/agents/fifth-drawer-scrapbook-pod.webp',
    },
  });
  expect(uniqueEntry(entries, 'thread-compass-stensibly-coordination')).toMatchObject({
    name: 'Thread Compass',
    creative: {
      inspiration: 'browse',
      style: 'custom',
    },
  });
  expect(uniqueEntry(entries, 'style-sparrow-creative-lanes')).toMatchObject({
    creative: {
      inspiration: 'thread',
      style: 'zine',
    },
  });

  const raccoon = uniqueEntry(entries, 'release-raccoon-install-fix');
  expect(raccoon.creative).toBeUndefined();
});
