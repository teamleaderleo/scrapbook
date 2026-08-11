import { expect, test } from '@playwright/test';
import type { Item } from '../../app/lib/item-types';
import {
  SPACE_PUBLIC_SNAPSHOT_KEY,
  createSpacePublicSnapshot,
  serializeSpacePublicSnapshot,
} from '../../lib/space-public-snapshot';

function readerItem(index: number): Item {
  return {
    id: `reader-sync-${index}`,
    title: `Reader sync ${index}`,
    slug: `reader-sync-${index}`,
    url: null,
    defaultIndex: 0,
    versions: [
      {
        label: 'notes',
        content: `Reader selection ${index}`,
        contentHtml: `<p>Reader selection ${index}</p>`,
        code: null,
        codeHtml: '',
      },
    ],
    tags: ['topic:continuity', 'source:test'],
    category: 'notes',
    createdAt: Date.parse('2026-08-10T00:00:00.000Z') + index,
    updatedAt: Date.parse('2026-08-10T00:00:00.000Z') + index,
  };
}

test('reader URL follows intentional item navigation and reload restores that item', async ({
  page,
}) => {
  const raw = serializeSpacePublicSnapshot(
    createSpacePublicSnapshot([readerItem(1), readerItem(2)], {
      savedAt: Date.now(),
      hasMore: false,
    })
  );

  await page.addInitScript(
    ({ key, value }) => window.localStorage.setItem(key, value),
    { key: SPACE_PUBLIC_SNAPSHOT_KEY, value: raw }
  );

  const response = await page.goto('/space/review');
  expect(response?.ok()).toBe(true);

  const firstHeading = page.getByRole('heading', { name: 'Reader sync 1' });
  await expect(firstHeading).toBeVisible({ timeout: 15_000 });

  await expect(page).toHaveURL(/\/space\/review\?item=reader-sync-1$/);

  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('heading', { name: 'Reader sync 2' })).toBeVisible();
  await expect(page).toHaveURL(/\/space\/review\?item=reader-sync-2$/);

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Reader sync 2' })).toBeVisible({
    timeout: 10_000,
  });
  await expect(page).toHaveURL(/\/space\/review\?item=reader-sync-2$/);

  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('heading', { name: 'Reader sync 1' })).toBeVisible();
  await expect(page).toHaveURL(/\/space\/review\?item=reader-sync-1$/);
});
