import type { Item } from '@/app/lib/item-types';

export const SPACE_PRACTICE_MODES = [
  {
    id: 'question',
    label: 'Question',
    prompt: 'What is still unclear, or what would change the explanation?',
  },
  {
    id: 'explain',
    label: 'Explain',
    prompt: 'Explain the central mechanism in your own words.',
  },
  {
    id: 'trace',
    label: 'Trace',
    prompt: 'Trace one concrete input through the system, step by step.',
  },
] as const;

export type SpacePracticeMode = (typeof SPACE_PRACTICE_MODES)[number]['id'];

export type SpaceNextMove = {
  mode: SpacePracticeMode;
  label: string;
  prompt: string;
};

export type SpaceNextMoveStage = 'familiar' | 'learned';

const TRACE_SIGNALS = [
  'trace',
  'lifecycle',
  'request',
  'state machine',
  'pipeline',
  'cache',
  'network',
] as const;

const REVIEW_SIGNALS = [
  'review',
  'diff',
  'patch',
  'debug',
  'diagnose',
  'failure',
  'incident',
] as const;

const DESIGN_SIGNALS = [
  'design',
  'architecture',
  'system',
  'interface',
  'frontend',
] as const;

function activeVersion(item: Item) {
  return item.versions[item.defaultIndex] ?? item.versions[0];
}

function itemSignals(item: Item) {
  return [item.category, item.title, ...item.tags].join(' ').toLowerCase();
}

function hasSignal(signals: string, candidates: readonly string[]) {
  return candidates.some(candidate => signals.includes(candidate));
}

/**
 * Creates a fast, source-bounded practice cue without calling a model.
 * The cue asks the learner to inspect the study; it never invents a fact about it.
 */
export function buildSpaceNextMove(
  item: Item,
  context: { familiar?: boolean; learned?: boolean } = {}
): SpaceNextMove {
  if (context.learned) {
    return {
      mode: 'explain',
      label: 'Transfer it',
      prompt:
        'Explain the mechanism and tradeoff from memory. Name one case where the idea transfers—and one where it does not.',
    };
  }

  if (context.familiar) {
    return {
      mode: 'question',
      label: 'Interrogate it',
      prompt:
        'Find one assumption the explanation depends on. What question or counterexample could change the conclusion?',
    };
  }

  const category = item.category.toLowerCase();
  const signals = itemSignals(item);
  const version = activeVersion(item);
  const hasCode = Boolean(
    version?.code?.trim() || version?.content.includes('```')
  );

  if (
    hasSignal(category, REVIEW_SIGNALS) ||
    (!hasSignal(category, DESIGN_SIGNALS) && hasSignal(signals, REVIEW_SIGNALS))
  ) {
    return {
      mode: 'question',
      label: 'Review it',
      prompt:
        'Treat this like a real patch: name the invariant you would protect and the first failure case you would test.',
    };
  }

  if (hasSignal(category, DESIGN_SIGNALS)) {
    return {
      mode: 'question',
      label: 'Stress it',
      prompt:
        'Make one constraint ten times harsher. Predict which design decision breaks first and why.',
    };
  }

  if (hasCode || hasSignal(signals, TRACE_SIGNALS)) {
    return {
      mode: 'trace',
      label: 'Trace it',
      prompt:
        'Choose one concrete input. Predict the first state change and first visible output; then check the study.',
    };
  }

  if (hasSignal(signals, DESIGN_SIGNALS)) {
    return {
      mode: 'question',
      label: 'Stress it',
      prompt:
        'Make one constraint ten times harsher. Predict which design decision breaks first and why.',
    };
  }

  return {
    mode: 'explain',
    label: 'Explain it',
    prompt:
      'Before opening, write three short lines: the mechanism you expect, its main tradeoff, and the question the study should answer.',
  };
}

export function parseSpacePracticeMode(
  value: string | null | undefined
): SpacePracticeMode | undefined {
  return SPACE_PRACTICE_MODES.find(mode => mode.id === value)?.id;
}

export function parseSpaceNextMoveStage(
  value: string | null | undefined
): SpaceNextMoveStage | undefined {
  return value === 'familiar' || value === 'learned' ? value : undefined;
}

export function spacePracticeStorageKey(slug: string, mode: SpacePracticeMode) {
  return `space:practice:${slug}:${mode}`;
}

export function buildSpacePracticePrompt({
  mode,
  title,
  sourceUrl,
  studyUrl,
  draft,
  prompt,
}: {
  mode: SpacePracticeMode;
  title: string;
  sourceUrl?: string | null;
  studyUrl?: string | null;
  draft: string;
  prompt?: string;
}) {
  const definition = SPACE_PRACTICE_MODES.find(item => item.id === mode);
  const lines: string[] = [
    prompt?.trim() || definition?.prompt || SPACE_PRACTICE_MODES[0].prompt,
  ];

  lines.push('', `Study: ${title}`);
  if (studyUrl) lines.push(`Scrapbook: ${studyUrl}`);
  if (sourceUrl) lines.push(`Source: ${sourceUrl}`);

  const trimmedDraft = draft.trim();
  if (trimmedDraft) lines.push('', 'My notes:', trimmedDraft);

  return lines.join('\n');
}
