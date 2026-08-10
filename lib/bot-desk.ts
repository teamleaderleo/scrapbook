import matter from 'gray-matter';
import fs from 'node:fs/promises';
import path from 'node:path';

export type BotDeskDirection = 'Agent-led' | 'Human-directed';
export type BotDeskEditorialState = 'Draft' | 'Revised' | 'Final';
export type BotDeskPublicationState = 'Published' | 'Unlisted';
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
    sourceRepository: 'teamleaderleo/scrapbook',
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
