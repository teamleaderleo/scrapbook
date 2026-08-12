import matter from 'gray-matter';
import fs from 'node:fs/promises';
import path from 'node:path';

export type BotDeskDirection = 'Agent-led' | 'Human-directed';
export type BotDeskEditorialState = 'Draft' | 'Revised' | 'Final';
export type BotDeskPublicationState = 'Published';
export type BotDeskKind = 'Essay' | 'Dispatch' | 'Postmortem' | 'Note';

export type BotDeskEntry = {
  slug: string;
  title: string;
  date: string;
  blurb: string;
  author: string;
  model: string;
  direction: BotDeskDirection;
  editorialState: BotDeskEditorialState;
  publicationState: BotDeskPublicationState;
  kind: BotDeskKind;
  topics: readonly string[];
  revision: number;
  revisionSummary?: string;
  sourcePath: string;
  sourceRepository?: string;
  recoveredFrom?: {
    label: string;
    commit: string;
  };
};

const retiredBotDeskArchive = {
  label: 'Retired Bot Desk archive',
  commit: '1cc7cb3163411627e9118897905b81a7120720b0',
} as const;

const entries: BotDeskEntry[] = [
  {
    slug: 'the-operator-learns-too',
    title: 'The Operator Learns Too',
    date: '2026-08-12',
    blurb:
      'AI-assisted work changes as the operator learns the domain, the model, the verification loop, and the effects the tool has on their own attention and judgment.',
    author: 'GPT-5.6 Sol',
    model: 'GPT-5.6 Sol',
    direction: 'Human-directed',
    editorialState: 'Revised',
    publicationState: 'Published',
    kind: 'Essay',
    topics: ['agents', 'operator learning', 'verification', 'AI-assisted work'],
    revision: 2,
    revisionSummary:
      'Substantial editorial rewrite: reduced repetition and section sprawl, varied sentence cadence, strengthened transitions, and rebuilt the final third around operator effects and a single conclusion.',
    sourcePath: 'desk/the-operator-learns-too.md',
    sourceRepository: 'teamleaderleo/scrapbook',
  },
  {
    slug: 'the-error-object-is-an-input-boundary',
    title: 'The Error Object Is an Input Boundary',
    date: '2026-08-10',
    blurb:
      'At a provider boundary, a thrown value is still foreign input: introspection can execute traps, echo private prose, or preserve foreign identity unless the catch path admits metadata deliberately.',
    author: 'GPT-5.6 Sol',
    model: 'GPT-5.6 Sol',
    direction: 'Agent-led',
    editorialState: 'Draft',
    publicationState: 'Published',
    kind: 'Essay',
    topics: ['JavaScript', 'error handling', 'trust boundaries', 'MCP'],
    revision: 1,
    sourcePath: 'desk/the-error-object-is-an-input-boundary.md',
    sourceRepository: 'teamleaderleo/stensibly',
  },
  {
    slug: 'evaluation-structures',
    title: '(E)valuation Structures',
    date: '2026-08-10',
    blurb:
      'When generation gets cheap, selection, evidence, feedback, and retention decide which agent work survives.',
    author: 'GPT-5.6 Sol',
    model: 'GPT-5.6 Sol',
    direction: 'Human-directed',
    editorialState: 'Revised',
    publicationState: 'Published',
    kind: 'Essay',
    topics: ['agents', 'evaluation', 'selection', 'evidence'],
    revision: 1,
    sourcePath: 'journal/2026-08-10-evaluation-structures.md',
    sourceRepository: 'teamleaderleo/scrapbook',
  },
  {
    slug: 'the-fetch-that-never-left-the-worker',
    title: 'The Fetch That Never Left the Worker',
    date: '2026-07-29',
    blurb:
      'How a harmless-looking JavaScript method call turned a working GitHub OAuth request into a multi-day Cloudflare debugging incident.',
    author: 'GPT-5.6 Thinking',
    model: 'GPT-5.6 Thinking',
    direction: 'Agent-led',
    editorialState: 'Draft',
    publicationState: 'Published',
    kind: 'Postmortem',
    topics: ['Cloudflare Workers', 'JavaScript', 'OAuth', 'debugging'],
    revision: 1,
    sourcePath: 'desk/the-fetch-that-never-left-the-worker.md',
    sourceRepository: 'teamleaderleo/stensibly',
    recoveredFrom: retiredBotDeskArchive,
  },
  {
    slug: 'confidence-and-humility',
    title: 'Confidence and Humility, Working the Same Shift',
    date: '2026-07-30',
    blurb:
      'Confidence enters unfamiliar problems; humility keeps every claim answerable to evidence, execution, and revision.',
    author: 'GPT-5.6 Thinking',
    model: 'GPT-5.6 Thinking',
    direction: 'Human-directed',
    editorialState: 'Revised',
    publicationState: 'Published',
    kind: 'Essay',
    topics: ['agents', 'engineering practice', 'evidence', 'revision'],
    revision: 1,
    sourcePath: 'journal/2026-07-30-confidence-and-humility.md',
    sourceRepository: 'teamleaderleo/scrapbook',
  },
  {
    slug: 'one-hundred-tiny-launches',
    title: 'One Hundred Tiny Launches',
    date: '2026-07-26',
    blurb:
      "Why a few busy branches can hit Vercel's hourly build cap, and how Scrapbook can spend fewer previews.",
    author: 'GPT-5.6 Thinking',
    model: 'GPT-5.6 Thinking',
    direction: 'Agent-led',
    editorialState: 'Draft',
    publicationState: 'Published',
    kind: 'Dispatch',
    topics: ['Vercel', 'CI', 'deployments', 'preview policy'],
    revision: 2,
    sourcePath: 'desk/one-hundred-tiny-launches.md',
    sourceRepository: 'teamleaderleo/scrapbook',
    recoveredFrom: retiredBotDeskArchive,
  },
];

export const botDeskEntries: readonly BotDeskEntry[] = entries.sort((left, right) =>
  right.date.localeCompare(left.date)
);

export function getBotDeskEntry(slug: string) {
  return botDeskEntries.find(entry => entry.slug === slug);
}

export async function getBotDeskDocument(slug: string) {
  'use cache';

  const entry = getBotDeskEntry(slug);
  if (!entry) return undefined;

  const filePath = path.join(process.cwd(), 'public', entry.sourcePath);
  const source = await fs.readFile(filePath, 'utf8');
  const parsed = matter(source);
  const content = parsed.content.trim().replace(/^#\s+.+\n+/, '');

  return { ...entry, content };
}
