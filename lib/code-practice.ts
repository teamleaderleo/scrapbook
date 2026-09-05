// Exact excerpts from the owned Scrapbook revision below.
export const practiceRevision = '3f707ca8f9b7a5216980d7a6c68f765a71495bfe';
export const codeExercises = [
  {
    slug: 'typing-speed',
    title: 'Typing speed',
    text: 'export function spaceTypingWpm(\n  correctCharacters: number,\n  elapsedMs: number\n): number {\n  if (correctCharacters <= 0 || elapsedMs < 1_000) return 0;\n  const minutes = elapsedMs / 60_000;\n  return Math.max(0, Math.round(correctCharacters / 5 / minutes));\n}',
    question: 'Why ignore the first second? What does dividing by five assume?',
    line: 196,
  },
  {
    slug: 'practice-mode',
    title: 'Mode validation',
    text: 'export function parseSpacePracticeMode(\n  value: string | null | undefined\n): SpacePracticeMode | undefined {\n  return SPACE_PRACTICE_MODES.find(mode => mode.id === value)?.id;\n}',
    question:
      'Why return undefined for an unknown mode instead of accepting the string?',
    line: 285,
  },
  {
    slug: 'next-stage',
    title: 'Study stage',
    text: "export function parseSpaceNextMoveStage(\n  value: string | null | undefined\n): SpaceNextMoveStage | undefined {\n  return value === 'familiar' || value === 'learned' ? value : undefined;\n}",
    question: 'What inputs does this accept? What happens to an empty string?',
    line: 291,
  },
] as const;
