import type { Item } from '@/app/lib/item-types';

export const SPACE_TRAIL_MEMORY_VERSION = 1 as const;

export type SpaceTrailReaction = 'more' | 'less' | 'learned';

export type SpaceTrailMemory = {
  version: typeof SPACE_TRAIL_MEMORY_VERSION;
  reactions: Record<string, SpaceTrailReaction>;
  opened: string[];
  resumeId?: string;
};

export type SpaceTrailRecommendation = {
  item: Item;
  excerpt: string;
  estimatedMinutes: number;
  reasons: string[];
};

export const EMPTY_SPACE_TRAIL_MEMORY: SpaceTrailMemory = {
  version: SPACE_TRAIL_MEMORY_VERSION,
  reactions: {},
  opened: [],
};

const NON_INTEREST_TAG_PREFIXES = [
  'device:',
  'state:',
  'time:',
  'visibility:',
] as const;

const FIELDWORK_TAGS = new Set(['source:fieldwork', 'source:linux-fieldwork']);

function hashUnit(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4_294_967_295;
}

function normalizedTags(item: Item) {
  return item.tags.map(tag => tag.trim().toLowerCase()).filter(Boolean);
}

function interestFeatures(item: Item) {
  const features = [`category:${item.category.trim().toLowerCase()}`];
  for (const tag of normalizedTags(item)) {
    if (NON_INTEREST_TAG_PREFIXES.some(prefix => tag.startsWith(prefix))) {
      continue;
    }
    features.push(tag);
  }
  return [...new Set(features)];
}

function isFieldworkItem(item: Item) {
  const url = item.url?.toLowerCase() ?? '';
  return (
    normalizedTags(item).some(tag => FIELDWORK_TAGS.has(tag)) ||
    url.includes('github.com/teamleaderleo/fieldwork') ||
    url.includes('github.com/teamleaderleo/linux-fieldwork')
  );
}

function activeContent(item: Item) {
  return (
    item.versions[item.defaultIndex]?.content ?? item.versions[0]?.content ?? ''
  );
}

export function trailItemExcerpt(item: Item, maxLength = 360) {
  const text = activeContent(item)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^[#>*+-]+\s*/gm, '')
    .replace(/[\*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length <= maxLength) return text;
  const clipped = text.slice(0, maxLength + 1);
  const lastSpace = clipped.lastIndexOf(' ');
  return `${clipped.slice(0, Math.max(lastSpace, maxLength - 40)).trim()}…`;
}

export function estimateTrailMinutes(item: Item) {
  for (const tag of normalizedTags(item)) {
    const match = tag.match(/^time:(\d+)\s*min/);
    if (match) return Math.max(1, Number.parseInt(match[1], 10));
  }

  const wordCount = activeContent(item)
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(2, Math.min(30, Math.ceil(wordCount / 180)));
}

export function parseSpaceTrailMemory(value: string | null): SpaceTrailMemory {
  if (!value) return EMPTY_SPACE_TRAIL_MEMORY;

  try {
    const candidate = JSON.parse(value) as Partial<SpaceTrailMemory>;
    if (
      candidate.version !== SPACE_TRAIL_MEMORY_VERSION ||
      !candidate.reactions ||
      typeof candidate.reactions !== 'object' ||
      !Array.isArray(candidate.opened)
    ) {
      return EMPTY_SPACE_TRAIL_MEMORY;
    }

    const reactions = Object.fromEntries(
      Object.entries(candidate.reactions).filter(
        (entry): entry is [string, SpaceTrailReaction] =>
          Boolean(entry[0]) &&
          (entry[1] === 'more' || entry[1] === 'less' || entry[1] === 'learned')
      )
    );
    const opened = candidate.opened
      .filter((id): id is string => typeof id === 'string' && Boolean(id))
      .slice(-500);

    return {
      version: SPACE_TRAIL_MEMORY_VERSION,
      reactions,
      opened: [...new Set(opened)],
      resumeId:
        typeof candidate.resumeId === 'string' && candidate.resumeId
          ? candidate.resumeId
          : undefined,
    };
  } catch {
    return EMPTY_SPACE_TRAIL_MEMORY;
  }
}

export function updateSpaceTrailReaction(
  memory: SpaceTrailMemory,
  itemId: string,
  reaction: SpaceTrailReaction | null
): SpaceTrailMemory {
  const reactions = { ...memory.reactions };
  if (reaction) reactions[itemId] = reaction;
  else delete reactions[itemId];

  return { ...memory, reactions };
}

export function markSpaceTrailOpened(
  memory: SpaceTrailMemory,
  itemId: string
): SpaceTrailMemory {
  return {
    ...memory,
    opened: [...memory.opened.filter(id => id !== itemId), itemId].slice(-500),
    resumeId: itemId,
  };
}

export function setSpaceTrailResume(
  memory: SpaceTrailMemory,
  itemId: string
): SpaceTrailMemory {
  if (memory.resumeId === itemId) return memory;
  return { ...memory, resumeId: itemId };
}

export function rankSpaceTrail(
  items: Item[],
  memory: SpaceTrailMemory,
  options: { seed: string; nowMs: number }
): SpaceTrailRecommendation[] {
  const itemById = new Map(items.map(item => [item.id, item]));
  const affinity = new Map<string, number>();

  for (const [itemId, reaction] of Object.entries(memory.reactions)) {
    const item = itemById.get(itemId);
    if (!item) continue;
    const weight = reaction === 'more' ? 2.5 : reaction === 'less' ? -2 : 0;
    if (weight === 0) continue;
    for (const feature of interestFeatures(item)) {
      affinity.set(feature, (affinity.get(feature) ?? 0) + weight);
    }
  }

  const opened = new Set(memory.opened);
  const candidates = items
    .filter(item => memory.reactions[item.id] !== 'less')
    .map(item => {
      const features = interestFeatures(item);
      const matchingFeatures = features
        .map(feature => ({ feature, weight: affinity.get(feature) ?? 0 }))
        .filter(match => match.weight > 0)
        .sort((a, b) => b.weight - a.weight);
      const affinityScore = matchingFeatures
        .slice(0, 3)
        .reduce((total, match) => total + match.weight, 0);
      const ageDays = Math.max(
        0,
        (options.nowMs - item.updatedAt) / 86_400_000
      );
      const freshnessScore = Math.max(0, 2 - ageDays / 45);
      const explorationScore = hashUnit(`${options.seed}:${item.id}`) * 2.2;
      const estimatedMinutes = estimateTrailMinutes(item);
      const fieldwork = isFieldworkItem(item);
      const learned = memory.reactions[item.id] === 'learned';
      const score =
        affinityScore +
        freshnessScore +
        explorationScore +
        (fieldwork ? 1.25 : 0) +
        (estimatedMinutes <= 5 ? 0.5 : 0) +
        (opened.has(item.id) ? -1.25 : 1.5) +
        (learned ? -2.5 : 0);

      const reasons: string[] = [];
      if (matchingFeatures.length > 0) {
        const feature = matchingFeatures[0].feature.replace(/^[^:]+:/, '');
        reasons.push(`Matches ${feature}, which you asked to see more often`);
      }
      if (fieldwork) reasons.push('Connected to Fieldwork');
      if (ageDays <= 30) reasons.push('Recently updated');
      if (estimatedMinutes <= 5) reasons.push('Fits a short session');
      if (reasons.length === 0 || explorationScore > 1.85) {
        reasons.push('A deliberate detour to keep the trail varied');
      }

      return {
        item,
        features,
        score,
        recommendation: {
          item,
          excerpt: trailItemExcerpt(item),
          estimatedMinutes,
          reasons: reasons.slice(0, 3),
        } satisfies SpaceTrailRecommendation,
      };
    });

  const ranked: SpaceTrailRecommendation[] = [];
  let previousFeatures = new Set<string>();
  let previousCategory = '';

  while (candidates.length > 0) {
    let bestIndex = 0;
    let bestScore = Number.NEGATIVE_INFINITY;

    for (let index = 0; index < candidates.length; index += 1) {
      const candidate = candidates[index];
      const category = candidate.item.category.trim().toLowerCase();
      const overlap = candidate.features.filter(feature =>
        previousFeatures.has(feature)
      ).length;
      const sequencePenalty =
        (category === previousCategory ? 2.75 : 0) +
        Math.min(1.5, overlap * 0.5);
      const sequenceScore = candidate.score - sequencePenalty;
      if (sequenceScore > bestScore) {
        bestScore = sequenceScore;
        bestIndex = index;
      }
    }

    const [selected] = candidates.splice(bestIndex, 1);
    ranked.push(selected.recommendation);
    previousFeatures = new Set(selected.features);
    previousCategory = selected.item.category.trim().toLowerCase();
  }

  return ranked;
}
