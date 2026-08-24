import type { Item } from '@/app/lib/item-types';

export const SPACE_LANES = [
  {
    id: 'open',
    label: 'Open',
    description: 'Notes and practical studies outside the drill archive.',
  },
  {
    id: 'interview',
    label: 'Interview',
    description: 'Implementation, review, design, deep dives, and interview scales.',
  },
  {
    id: 'fieldwork',
    label: 'From Fieldwork',
    description: 'Studies tied to Fieldwork and Linux Fieldwork.',
  },
  {
    id: 'scales',
    label: 'Scales',
    description: 'Algorithms, templates, typing, and other repeatable drills.',
  },
  {
    id: 'archive',
    label: 'Archive',
    description: 'Every published item.',
  },
] as const;

export type SpaceLaneId = (typeof SPACE_LANES)[number]['id'];

const INTERVIEW_TAG = 'prep:interview';
const SCALE_CATEGORIES = new Set(['leetcode', 'template', 'drill', 'typing']);
const SCALE_TAGS = new Set([
  'type:leetcode',
  'type:template',
  'mode:drill',
  'mode:typing',
]);
const FIELDWORK_TAGS = new Set([
  'source:fieldwork',
  'source:linux-fieldwork',
]);

function normalizedTags(item: Item) {
  return item.tags.map(tag => tag.trim().toLowerCase());
}

export function isSpaceLaneId(value: string | null): value is SpaceLaneId {
  return SPACE_LANES.some(lane => lane.id === value);
}

export function resolveSpaceLane(
  value: string | null,
  options: { hasQuery?: boolean; hasTarget?: boolean } = {}
): SpaceLaneId {
  if (isSpaceLaneId(value)) return value;
  return options.hasQuery || options.hasTarget ? 'archive' : 'open';
}

export function itemMatchesSpaceLane(item: Item, lane: SpaceLaneId): boolean {
  if (lane === 'archive') return true;

  const tags = normalizedTags(item);
  const category = item.category.trim().toLowerCase();
  const url = item.url?.toLowerCase() ?? '';
  const fromFieldwork =
    tags.some(tag => FIELDWORK_TAGS.has(tag)) ||
    url.includes('github.com/teamleaderleo/fieldwork') ||
    url.includes('github.com/teamleaderleo/linux-fieldwork');
  const isScale =
    SCALE_CATEGORIES.has(category) || tags.some(tag => SCALE_TAGS.has(tag));
  const isInterview = tags.includes(INTERVIEW_TAG);

  if (lane === 'interview') return isInterview;
  if (lane === 'fieldwork') return fromFieldwork;
  if (lane === 'scales') return isScale;

  return !isScale;
}

export function filterItemsBySpaceLane(items: Item[], lane: SpaceLaneId) {
  return items.filter(item => itemMatchesSpaceLane(item, lane));
}

export function countItemsBySpaceLane(items: Item[]) {
  return Object.fromEntries(
    SPACE_LANES.map(lane => [
      lane.id,
      items.filter(item => itemMatchesSpaceLane(item, lane.id)).length,
    ])
  ) as Record<SpaceLaneId, number>;
}
