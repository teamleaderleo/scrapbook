import { expect, test } from '@playwright/test';
import type { Item } from '../../app/lib/item-types';
import {
  SPACE_PUBLIC_SNAPSHOT_KEY,
  createSpacePublicSnapshot,
  serializeSpacePublicSnapshot,
} from '../../lib/space-public-snapshot';

const cachedTitle = 'Cached continuity sentinel';

function cachedItem(): Item {
  return {
    id: '00000000-0000-4000-8000-000000000553',
    title: cachedTitle,
    slug: 'cached-continuity-sentinel',
    url: null,
    defaultIndex: 0,
    versions: [
      {
        label: 'notes',
        content: 'A public snapshot used to verify stale-readable Space.',
        contentHtml:
          '<p>A public snapshot used to verify stale-readable Space.</p>',
        code: null,
        codeHtml: '',
      },
    ],
    tags: ['topic:continuity', 'source:test'],
    category: 'notes',
    createdAt: Date.parse('2026-08-10T00:00:00.000Z'),
    updatedAt: Date.parse('2026-08-10T00:00:00.000Z'),
  };
}

test('uses a recent public snapshot only when the server returned no usable archive', async ({
  page,
}) => {
  let response = await page.goto('/space');
  expect(response?.ok()).toBe(true);
  await expect(page.getByRole('heading', { name: 'Space' })).toBeVisible({
    timeout: 15_000,
  });

  const hadInitialError = await page.getByRole('alert').isVisible().catch(() => false);
  const hadLiveReadingRows =
    (await page.locator('a[href^="/space/read/"]').count()) > 0;
  const serverReturnedFailedEmptyArchive = hadInitialError && !hadLiveReadingRows;

  const raw = serializeSpacePublicSnapshot(
    createSpacePublicSnapshot([cachedItem()], {
      savedAt: Date.now(),
      hasMore: false,
    })
  );
  await page.evaluate(
    ({ key, value }) => window.localStorage.setItem(key, value),
    { key: SPACE_PUBLIC_SNAPSHOT_KEY, value: raw }
  );

  response = await page.reload();
  expect(response?.ok()).toBe(true);
  await expect(page.getByRole('heading', { name: 'Space' })).toBeVisible({
    timeout: 15_000,
  });

  if (serverReturnedFailedEmptyArchive) {
    await expect(page.getByRole('link', { name: cachedTitle })).toBeVisible({
      timeout: 5_000,
    });
  } else {
    await expect(page.getByRole('link', { name: cachedTitle })).toHaveCount(0);
  }
});
