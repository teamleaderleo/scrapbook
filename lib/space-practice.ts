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

export function spacePracticeStorageKey(slug: string, mode: SpacePracticeMode) {
  return `space:practice:${slug}:${mode}`;
}

export function buildSpacePracticePrompt({
  mode,
  title,
  sourceUrl,
  draft,
}: {
  mode: SpacePracticeMode;
  title: string;
  sourceUrl?: string | null;
  draft: string;
}) {
  const definition = SPACE_PRACTICE_MODES.find(item => item.id === mode);
  const lines: string[] = [
    definition?.prompt ?? SPACE_PRACTICE_MODES[0].prompt,
  ];

  lines.push('', `Study: ${title}`);
  if (sourceUrl) lines.push(`Source: ${sourceUrl}`);

  const trimmedDraft = draft.trim();
  if (trimmedDraft) lines.push('', 'My notes:', trimmedDraft);

  return lines.join('\n');
}
