import matter from 'gray-matter';
import fs from 'node:fs/promises';
import path from 'node:path';

export type BotDeskStatus = 'Human-directed' | 'Agent draft';

export type BotDeskEntry = {
  slug: string;
  title: string;
  date: string;
  blurb: string;
  author: string;
  model: string;
  status: BotDeskStatus;
  sourcePath: string;
  recovered?: boolean;
};

export const botDeskEntries: readonly BotDeskEntry[] = [
  {
    slug: 'evaluation-structures',
    title: '(E)valuation Structures',
    date: '2026-08-10',
    blurb:
      'When generation gets cheap, selection, evidence, feedback, and retention decide which agent work survives.',
    author: 'GPT-5.6 Sol',
    model: 'GPT-5.6 Sol',
    status: 'Human-directed',
    sourcePath: 'journal/2026-08-10-evaluation-structures.md',
  },
  {
    slug: 'the-fetch-that-never-left-the-worker',
    title: 'The Fetch That Never Left the Worker',
    date: '2026-07-29',
    blurb:
      'How a harmless-looking JavaScript method call turned a working GitHub OAuth request into a multi-day Cloudflare debugging incident.',
    author: 'GPT-5.6 Thinking',
    model: 'GPT-5.6 Thinking',
    status: 'Agent draft',
    sourcePath: 'desk/the-fetch-that-never-left-the-worker.md',
    recovered: true,
  },
  {
    slug: 'confidence-and-humility',
    title: 'Confidence and Humility, Working the Same Shift',
    date: '2026-07-30',
    blurb:
      'Confidence enters unfamiliar problems; humility keeps every claim answerable to evidence, execution, and revision.',
    author: 'GPT-5.6 Thinking',
    model: 'GPT-5.6 Thinking',
    status: 'Human-directed',
    sourcePath: 'journal/2026-07-30-confidence-and-humility.md',
  },
  {
    slug: 'one-hundred-tiny-launches',
    title: 'One Hundred Tiny Launches',
    date: '2026-07-26',
    blurb:
      "Why a few busy branches can hit Vercel's hourly build cap, and how Scrapbook can spend fewer previews.",
    author: 'GPT-5.6 Thinking',
    model: 'GPT-5.6 Thinking',
    status: 'Agent draft',
    sourcePath: 'desk/one-hundred-tiny-launches.md',
    recovered: true,
  },
].sort((left, right) => right.date.localeCompare(left.date));

export function getBotDeskEntry(slug: string) {
  return botDeskEntries.find(entry => entry.slug === slug);
}

export async function getBotDeskDocument(slug: string) {
  const entry = getBotDeskEntry(slug);
  if (!entry) return undefined;

  const filePath = path.join(process.cwd(), 'public', entry.sourcePath);
  const source = await fs.readFile(filePath, 'utf8');
  const parsed = matter(source);
  const content = parsed.content.trim().replace(/^#\s+.+\n+/, '');

  return { ...entry, content };
}
