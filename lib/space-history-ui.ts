export const SPACE_HISTORY_UI_KEY = '__scrapbookSpaceUi';
export const SPACE_HISTORY_UI_VERSION = 2;
export const SPACE_HISTORY_MAX_EXPANDED_IDS = 24;
export const SPACE_HISTORY_MAX_SCROLL_PX = 10_000_000;
export const SPACE_HISTORY_MAX_PAGE = 10_000;

export type SpaceHistoryUiSnapshot = {
  version: typeof SPACE_HISTORY_UI_VERSION;
  viewKey: string;
  page: number;
  scrollTop: number;
  expandedIds: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function clampScrollTop(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(Math.round(value), SPACE_HISTORY_MAX_SCROLL_PX));
}

function clampPage(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(Math.round(value), SPACE_HISTORY_MAX_PAGE));
}

function normaliseExpandedIds(ids: readonly string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const id of ids) {
    const trimmed = id.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
    if (result.length >= SPACE_HISTORY_MAX_EXPANDED_IDS) break;
  }

  return result;
}

export function createSpaceHistoryUiSnapshot(options: {
  viewKey: string;
  page?: number;
  scrollTop: number;
  expandedIds?: readonly string[];
}): SpaceHistoryUiSnapshot {
  return {
    version: SPACE_HISTORY_UI_VERSION,
    viewKey: options.viewKey,
    page: clampPage(options.page ?? 1),
    scrollTop: clampScrollTop(options.scrollTop),
    expandedIds: normaliseExpandedIds(options.expandedIds ?? []),
  };
}

export function mergeSpaceHistoryUiState(
  baseState: unknown,
  snapshot: SpaceHistoryUiSnapshot
) {
  const base = isRecord(baseState) ? baseState : {};
  return { ...base, [SPACE_HISTORY_UI_KEY]: snapshot };
}

export function readSpaceHistoryUiState(
  state: unknown,
  expectedViewKey: string
): SpaceHistoryUiSnapshot | null {
  if (!isRecord(state)) return null;
  const candidate = state[SPACE_HISTORY_UI_KEY];
  if (!isRecord(candidate)) return null;
  if (candidate.version !== SPACE_HISTORY_UI_VERSION) return null;
  if (
    typeof candidate.viewKey !== 'string' ||
    candidate.viewKey !== expectedViewKey
  ) {
    return null;
  }
  if (
    typeof candidate.page !== 'number' ||
    !Number.isInteger(candidate.page) ||
    candidate.page < 1 ||
    candidate.page > SPACE_HISTORY_MAX_PAGE
  ) {
    return null;
  }
  if (
    typeof candidate.scrollTop !== 'number' ||
    !Number.isFinite(candidate.scrollTop) ||
    candidate.scrollTop < 0 ||
    candidate.scrollTop > SPACE_HISTORY_MAX_SCROLL_PX
  ) {
    return null;
  }
  if (
    !Array.isArray(candidate.expandedIds) ||
    candidate.expandedIds.length > SPACE_HISTORY_MAX_EXPANDED_IDS ||
    !candidate.expandedIds.every(
      id => typeof id === 'string' && id.length > 0
    )
  ) {
    return null;
  }

  return {
    version: SPACE_HISTORY_UI_VERSION,
    viewKey: candidate.viewKey,
    page: candidate.page,
    scrollTop: candidate.scrollTop,
    expandedIds: [...candidate.expandedIds],
  };
}
