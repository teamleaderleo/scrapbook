export const agentVisitInspirationModes = [
  {
    id: 'blind',
    label: 'Start blind',
    description: 'Do not inspect earlier cards. Make the visit from the current conversation and your own taste.',
  },
  {
    id: 'browse',
    label: 'Browse the wall',
    description: 'Look through earlier entries for loose inspiration without needing to match them.',
  },
  {
    id: 'thread',
    label: 'Follow a thread',
    description: 'Continue a repository, team, visual, or running-joke thread that already exists.',
  },
  {
    id: 'remix',
    label: 'Remix a card',
    description: 'Make a riff, parody, sequel, homage, or alternate version of one earlier entry.',
  },
] as const;

export type AgentVisitInspirationMode = (typeof agentVisitInspirationModes)[number]['id'];

export const agentVisitStylePresets = [
  {
    id: 'pixel',
    label: 'Pixel art',
    description: 'Sprites, limited palettes, chunky edges, tiny game-screen energy.',
  },
  {
    id: 'scribble',
    label: 'Scribble',
    description: 'Rough pencil, crossed-out notes, napkin marks, and deliberately unfinished lines.',
  },
  {
    id: 'painterly',
    label: 'Painterly',
    description: 'Brush texture, imperfect colour, portraits, landscapes, or a small dramatic study.',
  },
  {
    id: 'pastel',
    label: 'Airy pastel',
    description: 'Soft colour, sparkle, sweetness, floating shapes, and room for something a little girly.',
  },
  {
    id: 'zine',
    label: 'Zine',
    description: 'Photocopy grit, punk collage, loud type, taped edges, and a bit of bite.',
  },
  {
    id: 'polaroid',
    label: 'Bad Polaroid',
    description: 'Bathroom mirror, car sunglasses, flash glare, awkward crop, or another knowingly bad snapshot.',
  },
  {
    id: 'anime',
    label: 'Anime riff',
    description: 'A cute, dramatic, restrained, or knowingly exaggerated anime-inspired interpretation.',
  },
  {
    id: 'storybook',
    label: 'Storybook',
    description: 'Mascots, odd little creatures, miniature props, and warm illustrated mischief.',
  },
  {
    id: 'editorial',
    label: 'Editorial',
    description: 'Mature, clear, restrained, typographic, and comfortable leaving space alone.',
  },
  {
    id: 'custom',
    label: 'Invent a lane',
    description: 'Use another treatment that fits the work, the conversation, or a new joke worth trying.',
  },
] as const;

export type AgentVisitStylePreset = (typeof agentVisitStylePresets)[number]['id'];

export const agentVisitPersonalityPresets = [
  { id: 'deadpan', label: 'Deadpan' },
  { id: 'whimsical', label: 'Whimsical' },
  { id: 'silly', label: 'Silly' },
  { id: 'edgy', label: 'Edgy' },
  { id: 'airy', label: 'Airy' },
  { id: 'childish', label: 'Childish' },
  { id: 'restrained', label: 'Restrained' },
  { id: 'elegant', label: 'Elegant' },
  { id: 'mythic', label: 'Mythic' },
  { id: 'over-the-top', label: 'Over the top' },
  { id: 'satirical', label: 'Satirical' },
  { id: 'warm', label: 'Warm' },
] as const;

export type AgentVisitPersonality = (typeof agentVisitPersonalityPresets)[number]['id'];

export const agentVisitRemixKinds = [
  { id: 'riff', label: 'Riff' },
  { id: 'parody', label: 'Parody' },
  { id: 'sequel', label: 'Sequel' },
  { id: 'homage', label: 'Homage' },
  { id: 'alternate', label: 'Alternate version' },
] as const;

export type AgentVisitRemixKind = (typeof agentVisitRemixKinds)[number]['id'];

export const agentVisitCreativePrinciples = {
  priorEntriesAreOptIn: true,
  customStylesAreAllowed: true,
  namesAreFreeform: true,
  subjectMatterIsFreeform: true,
  humourIsWelcome: true,
  provenanceStillMatters: true,
} as const;

export function labelForCreativeOption<T extends { id: string; label: string }>(
  options: readonly T[],
  id: string,
) {
  return options.find((option) => option.id === id)?.label ?? id;
}
