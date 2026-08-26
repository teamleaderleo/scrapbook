export const SPACE_ITEM_PRACTICE_CHOICES = [
  { id: 'read', label: 'Read', category: 'explain' },
  { id: 'implement', label: 'Implement', category: 'practical' },
  { id: 'review', label: 'Review', category: 'review' },
  { id: 'debug', label: 'Debug', category: 'debug' },
  { id: 'design', label: 'Design', category: 'design' },
  { id: 'deep-dive', label: 'Deep dive', category: 'explain' },
  { id: 'typing', label: 'Type', category: 'typing' },
] as const;

export type SpaceItemPracticeChoice =
  (typeof SPACE_ITEM_PRACTICE_CHOICES)[number]['id'];

type SpaceItemClassification = {
  tags: string[];
  category: string | null;
};

const INTERVIEW_TAG = 'prep:interview';
const MODE_PREFIX = 'mode:';

function dedupeTags(tags: string[]) {
  const seen = new Set<string>();
  return tags.filter(tag => {
    const normalized = tag.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

export function isInterviewSpaceItem(tags: string[]) {
  return tags.some(tag => tag.trim().toLowerCase() === INTERVIEW_TAG);
}

export function setSpaceItemInterviewPrep(tags: string[], enabled: boolean) {
  const next = tags.filter(
    tag => tag.trim().toLowerCase() !== INTERVIEW_TAG
  );
  if (enabled) next.push(INTERVIEW_TAG);
  return dedupeTags(next);
}

export function readSpaceItemPracticeChoice(
  tags: string[]
): SpaceItemPracticeChoice {
  const mode = tags
    .map(tag => tag.trim().toLowerCase())
    .find(tag => tag.startsWith(MODE_PREFIX))
    ?.slice(MODE_PREFIX.length);

  return (
    SPACE_ITEM_PRACTICE_CHOICES.find(choice => choice.id === mode)?.id ?? 'read'
  );
}

export function applySpaceItemPracticeChoice<T extends SpaceItemClassification>(
  model: T,
  choiceId: SpaceItemPracticeChoice
): Omit<T, keyof SpaceItemClassification> & SpaceItemClassification {
  const choice =
    SPACE_ITEM_PRACTICE_CHOICES.find(candidate => candidate.id === choiceId) ??
    SPACE_ITEM_PRACTICE_CHOICES[0];
  const tags = model.tags.filter(
    tag => !tag.trim().toLowerCase().startsWith(MODE_PREFIX)
  );
  tags.push(`${MODE_PREFIX}${choice.id}`);

  return {
    ...model,
    category: choice.category,
    tags: dedupeTags(tags),
  };
}
