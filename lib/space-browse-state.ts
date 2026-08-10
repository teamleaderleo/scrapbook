export type SpaceBrowseState = {
  lane?: string | null;
  tags?: string | null;
  item?: string | null;
};

export type SpaceBrowseView = 'list' | 'reader';

function cleanValue(value: string | null | undefined) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : undefined;
}

export function createSpaceBrowseParams(state: SpaceBrowseState) {
  const params = new URLSearchParams();
  const lane = cleanValue(state.lane);
  const tags = cleanValue(state.tags);
  const item = cleanValue(state.item);

  // Keep one stable parameter order everywhere so href equality, history keys,
  // and tests do not depend on the order each caller happened to append fields.
  if (lane) params.set('lane', lane);
  if (tags) params.set('tags', tags);
  if (item) params.set('item', item);
  return params;
}

export function createSpaceBrowseHref(
  pathname: '/space' | '/space/review',
  state: SpaceBrowseState = {}
) {
  const query = createSpaceBrowseParams(state).toString();
  return `${pathname}${query ? `?${query}` : ''}`;
}

export function createSpaceBrowseViewKey(
  view: SpaceBrowseView,
  state: SpaceBrowseState = {}
) {
  const query = createSpaceBrowseParams(state).toString();
  return `${view}:${query}`;
}
