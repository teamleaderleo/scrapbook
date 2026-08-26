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
  {
    id: 'review',
    label: 'Review',
    prompt:
      'Review this like production work: name the invariant, the riskiest assumption, and the first failure case you would test.',
  },
  {
    id: 'alter',
    label: 'Alter',
    prompt:
      'Change one constraint, edge case, or interface. Predict what must change and what should stay invariant.',
  },
  {
    id: 'type',
    label: 'Type',
    prompt:
      'Type the bounded excerpt exactly. Treat punctuation, identifiers, whitespace, and wording as part of the exercise.',
  },
] as const;

export type SpacePracticeMode = (typeof SPACE_PRACTICE_MODES)[number]['id'];

export type SpaceNextMove = {
  mode: SpacePracticeMode;
  label: string;
  prompt: string;
};

export type SpaceNextMoveStage = 'familiar' | 'learned';

export type SpaceTypingTarget = {
  kind: 'code' | 'prose';
  label: string;
  text: string;
};

export type SpaceTypingStats = {
  correctCharacters: number;
  errorCharacters: number;
  overflowCharacters: number;
  accuracy: number;
  progress: number;
  complete: boolean;
};

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

const MAX_TYPING_TARGET_CHARS = 900;

function activeVersion(item: Item) {
  return item.versions[item.defaultIndex] ?? item.versions[0];
}

function itemSignals(item: Item) {
  return [item.category, item.title, ...item.tags].join(' ').toLowerCase();
}

function hasSignal(signals: string, candidates: readonly string[]) {
  return candidates.some(candidate => signals.includes(candidate));
}

function truncateTypingText(text: string, maxChars = MAX_TYPING_TARGET_CHARS) {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) return trimmed;

  const sample = trimmed.slice(0, maxChars + 1);
  const floor = Math.floor(maxChars * 0.62);
  const boundaries = [
    sample.lastIndexOf('\n\n'),
    sample.lastIndexOf('\n'),
    sample.lastIndexOf('. '),
    sample.lastIndexOf('; '),
    sample.lastIndexOf(', '),
    sample.lastIndexOf(' '),
  ].filter(index => index >= floor);
  const cut = boundaries.length ? Math.max(...boundaries) : maxChars;

  return sample.slice(0, cut).trimEnd();
}

function firstFencedCodeBlock(markdown: string) {
  return markdown.match(/```[^\n]*\n([\s\S]*?)```/)?.[1]?.trim() ?? '';
}

function proseForTyping(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/[*_~`]/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function buildSpaceTypingTarget(
  item: Item,
  maxChars = MAX_TYPING_TARGET_CHARS
): SpaceTypingTarget | null {
  const version = activeVersion(item);
  if (!version) return null;

  const directCode = version.code?.trim() ?? '';
  const fencedCode = directCode ? '' : firstFencedCodeBlock(version.content);
  const code = directCode || fencedCode;

  if (code) {
    return {
      kind: 'code',
      label: `${version.label} code`,
      text: truncateTypingText(code, maxChars),
    };
  }

  const prose = proseForTyping(version.content);
  if (!prose) return null;

  return {
    kind: 'prose',
    label: `${version.label} excerpt`,
    text: truncateTypingText(prose, maxChars),
  };
}

export function compareSpaceTyping(
  target: string,
  typed: string
): SpaceTypingStats {
  let correctCharacters = 0;
  for (let index = 0; index < typed.length; index += 1) {
    if (typed[index] === target[index]) correctCharacters += 1;
  }

  const errorCharacters = typed.length - correctCharacters;
  const targetLength = target.length;

  return {
    correctCharacters,
    errorCharacters,
    overflowCharacters: Math.max(0, typed.length - targetLength),
    accuracy: typed.length === 0 ? 1 : correctCharacters / typed.length,
    progress:
      targetLength === 0 ? 1 : Math.min(typed.length, targetLength) / targetLength,
    complete: targetLength > 0 && typed === target,
  };
}

export function spaceTypingWpm(
  correctCharacters: number,
  elapsedMs: number
): number {
  if (correctCharacters <= 0 || elapsedMs < 1_000) return 0;
  const minutes = elapsedMs / 60_000;
  return Math.max(0, Math.round(correctCharacters / 5 / minutes));
}

/**
 * Creates a source-bounded practice cue without calling a model.
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
      mode: 'review',
      label: 'Review it',
      prompt:
        'Treat this like a real patch: name the invariant you would protect and the first failure case you would test.',
    };
  }

  if (hasSignal(category, DESIGN_SIGNALS)) {
    return {
      mode: 'alter',
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
      mode: 'alter',
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
  typingTarget,
}: {
  mode: SpacePracticeMode;
  title: string;
  sourceUrl?: string | null;
  studyUrl?: string | null;
  draft: string;
  prompt?: string;
  typingTarget?: SpaceTypingTarget | null;
}) {
  const definition = SPACE_PRACTICE_MODES.find(item => item.id === mode);
  const lines: string[] = [
    prompt?.trim() || definition?.prompt || SPACE_PRACTICE_MODES[0].prompt,
  ];

  lines.push('', `Study: ${title}`);
  if (studyUrl) lines.push(`Scrapbook: ${studyUrl}`);
  if (sourceUrl) lines.push(`Source: ${sourceUrl}`);
  if (mode === 'type' && typingTarget?.text) {
    lines.push('', `Typing reference (${typingTarget.label}):`, typingTarget.text);
  }

  const trimmedDraft = draft.trim();
  if (trimmedDraft) {
    lines.push('', mode === 'type' ? 'My copy:' : 'My notes:', trimmedDraft);
  }

  return lines.join('\n');
}
