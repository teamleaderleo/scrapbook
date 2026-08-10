import { expect, test } from '@playwright/test';
import type { Item } from '../../app/lib/item-types';
import {
  SPACE_PUBLIC_SNAPSHOT_KEY,
  createSpacePublicSnapshot,
  serializeSpacePublicSnapshot,
} from '../../lib/space-public-snapshot';

const RESTORED_ITEM_ID = 'resume-item-21';

function cachedItem(index: number): Item {
  const id = `resume-item-${String(index).padStart(2, '0')}`;
  const longParagraph = `Continuity detail ${index}. ${'Return to the same reading place. '.repeat(
    180
  )}`;

  return {
    id,
    title: `Resume item ${String(index).padStart(2, '0')}`,
    slug: id,
    url: null,
    defaultIndex: 0,
    versions: [
      {
        label: 'notes',
        content: longParagraph,
        contentHtml: `<p>${longParagraph}</p>`,
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

test('browser Back restores Space list page, expansion, and scroll for the same view', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });

  const raw = serializeSpacePublicSnapshot(
    createSpacePublicSnapshot(
      Array.from({ length: 25 }, (_, index) => cachedItem(index + 1)),
      {
        savedAt: Date.now(),
        hasMore: false,
      }
    )
  );

  await page.addInitScript(
    ({ key, value }) => window.localStorage.setItem(key, value),
    { key: SPACE_PUBLIC_SNAPSHOT_KEY, value: raw }
  );

  const response = await page.goto('/space');
  expect(response?.ok()).toBe(true);
  await expect(page.getByRole('heading', { name: 'Space' })).toBeVisible({
    timeout: 15_000,
  });

  const cachedSentinel = page.getByRole('link', { name: 'Resume item 01' });
  const cacheWasAdmitted = await cachedSentinel
    .isVisible({ timeout: 5_000 })
    .catch(() => false);
  test.skip(
    !cacheWasAdmitted,
    'This regression uses the failed/empty hosted archive so the saved public snapshot supplies deterministic rows.'
  );

  const pageIndicator = page.locator('[data-space-page-indicator]');
  await expect(pageIndicator).toHaveText('1 of 2');
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(pageIndicator).toHaveText('2 of 2');

  const restoredRow = page.locator(
    `[data-space-list-item="${RESTORED_ITEM_ID}"]`
  );
  await expect(restoredRow).toBeVisible();
  await restoredRow.locator('[data-space-list-toggle]').click();
  await expect(restoredRow).toHaveAttribute('data-expanded', 'true');

  const scroll = page.locator('[data-space-list-scroll]');
  const savedScrollTop = await scroll.evaluate(element => {
    const maximum = element.scrollHeight - element.clientHeight;
    element.scrollTop = Math.min(260, maximum);
    element.dispatchEvent(new Event('scroll'));
    return element.scrollTop;
  });
  expect(savedScrollTop).toBeGreaterThan(0);

  await expect
    .poll(() =>
      page.evaluate(
        ({ itemId, expectedScrollTop }) => {
          const snapshot = history.state?.__scrapbookSpaceUi;
          return {
            page: snapshot?.page,
            expanded: snapshot?.expandedIds?.includes(itemId) ?? false,
            scrollDelta:
              typeof snapshot?.scrollTop === 'number'
                ? Math.abs(snapshot.scrollTop - expectedScrollTop)
                : Number.POSITIVE_INFINITY,
          };
        },
        { itemId: RESTORED_ITEM_ID, expectedScrollTop: savedScrollTop }
      )
    )
    .toEqual({ page: 2, expanded: true, scrollDelta: 0 });

  await page.getByRole('link', { name: 'Open reading trail' }).click();
  await expect(page).toHaveURL(/\/space\/trail/);

  await page.goBack();
  await expect(page).toHaveURL(/\/space$/);
  await expect(pageIndicator).toHaveText('2 of 2');
  await expect(restoredRow).toHaveAttribute('data-expanded', 'true');
  await expect
    .poll(() =>
      scroll.evaluate((element, expected) =>
        Math.abs(element.scrollTop - Number(expected))
      , savedScrollTop)
    )
    .toBeLessThanOrEqual(2);
});
