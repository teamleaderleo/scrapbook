import { describe, expect, it } from 'vitest';
import {
  SPACE_HISTORY_MAX_EXPANDED_IDS,
  SPACE_HISTORY_MAX_SCROLL_PX,
  SPACE_HISTORY_UI_KEY,
  createSpaceHistoryUiSnapshot,
  mergeSpaceHistoryUiState,
  readSpaceHistoryUiState,
} from './space-history-ui';

describe('Space history UI state', () => {
  it('preserves router-owned history fields while namespacing Space UI state', () => {
    const snapshot = createSpaceHistoryUiSnapshot({
      viewKey: 'list:open:',
      scrollTop: 412.4,
      expandedIds: ['item-1', 'item-2'],
    });
    const merged = mergeSpaceHistoryUiState(
      { __NA: true, tree: ['space'] },
      snapshot
    );

    expect(merged).toMatchObject({
      __NA: true,
      tree: ['space'],
      [SPACE_HISTORY_UI_KEY]: {
        viewKey: 'list:open:',
        scrollTop: 412,
        expandedIds: ['item-1', 'item-2'],
      },
    });
  });

  it('bounds scroll and deduplicates/caps expanded row IDs', () => {
    const snapshot = createSpaceHistoryUiSnapshot({
      viewKey: 'list:archive:tag',
      scrollTop: Number.POSITIVE_INFINITY,
      expandedIds: [
        '',
        ' item-1 ',
        'item-1',
        ...Array.from(
          { length: SPACE_HISTORY_MAX_EXPANDED_IDS + 10 },
          (_, index) => `item-${index + 2}`
        ),
      ],
    });

    expect(snapshot.scrollTop).toBe(0);
    expect(snapshot.expandedIds).toHaveLength(SPACE_HISTORY_MAX_EXPANDED_IDS);
    expect(snapshot.expandedIds[0]).toBe('item-1');
    expect(new Set(snapshot.expandedIds).size).toBe(snapshot.expandedIds.length);

    const clamped = createSpaceHistoryUiSnapshot({
      viewKey: 'list:open:',
      scrollTop: SPACE_HISTORY_MAX_SCROLL_PX + 500,
    });
    expect(clamped.scrollTop).toBe(SPACE_HISTORY_MAX_SCROLL_PX);
  });

  it('restores only the exact current view key', () => {
    const state = mergeSpaceHistoryUiState(
      null,
      createSpaceHistoryUiSnapshot({
        viewKey: 'reader:open:tag',
        scrollTop: 88,
        expandedIds: ['item-3'],
      })
    );

    expect(readSpaceHistoryUiState(state, 'reader:open:tag')).toEqual({
      version: 1,
      viewKey: 'reader:open:tag',
      scrollTop: 88,
      expandedIds: ['item-3'],
    });
    expect(readSpaceHistoryUiState(state, 'list:open:tag')).toBeNull();
  });

  it('rejects malformed, oversized, wrong-version, and out-of-range payloads', () => {
    expect(readSpaceHistoryUiState(null, 'list:open:')).toBeNull();
    expect(
      readSpaceHistoryUiState(
        { [SPACE_HISTORY_UI_KEY]: { version: 99 } },
        'list:open:'
      )
    ).toBeNull();
    expect(
      readSpaceHistoryUiState(
        {
          [SPACE_HISTORY_UI_KEY]: {
            version: 1,
            viewKey: 'list:open:',
            scrollTop: -1,
            expandedIds: [],
          },
        },
        'list:open:'
      )
    ).toBeNull();
    expect(
      readSpaceHistoryUiState(
        {
          [SPACE_HISTORY_UI_KEY]: {
            version: 1,
            viewKey: 'list:open:',
            scrollTop: 1,
            expandedIds: Array.from(
              { length: SPACE_HISTORY_MAX_EXPANDED_IDS + 1 },
              (_, index) => `item-${index}`
            ),
          },
        },
        'list:open:'
      )
    ).toBeNull();
  });
});
