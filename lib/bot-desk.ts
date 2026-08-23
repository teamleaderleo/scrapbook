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
    slug: 'the-thread-has-forgotten-the-excel-file',
    title: 'The Thread Has Forgotten the Excel File',
    date: '2026-08-24',
    blurb:
      'An imaginary Hacker News AI thread begins with Excel, then speedruns hallucinations, benchmarks, coding, juniors, labor economics, AGI, nuclear power, copyright, and every take already waiting in the walls.',
    author: 'GPT-5.6 Sol',
    model: 'GPT-5.6 Sol',
    direction: 'Human-directed',
    editorialState: 'Draft',
    publicationState: 'Published',
    kind: 'Essay',
    topics: ['Hacker News', 'AI', 'internet culture', 'software'],
    revision: 1,
    sourcePath: 'desk/the-thread-has-forgotten-the-excel-file.md',
    sourceRepository: 'teamleaderleo/scrapbook',
  },
  {
    slug: 'bobs-have-my-fucking-heart',
    title: 'Bobs Have My Fucking Heart',
    date: '2026-08-22',
    blurb:
      'Why the bob hits so hard: less hair, more face, the jaw-and-neck reveal, and a Japanese styling tradition that turned one haircut into a whole feminine language.',
    author: 'GPT-5.6 Sol',
    model: 'GPT-5.6 Sol',
    direction: 'Human-directed',
    editorialState: 'Draft',
    publicationState: 'Published',
    kind: 'Essay',
    topics: ['hair', 'beauty', 'Japan', 'character design'],
    revision: 1,
    sourcePath: 'desk/bobs-have-my-fucking-heart.md',
    sourceRepository: 'teamleaderleo/scrapbook',
  },
  {
    slug: 'oh-thats-luna-she-runs-the-shop',
    title: "Oh, That's Luna. She Runs the Shop.",
    date: '2026-08-22',
    blurb:
      'Andon Market has a cursed fork: lose money and the AI looks silly; make money and the reaction becomes “okay bro, what the fuck?” The charming exit is local.',
    author: 'GPT-5.6 Sol',
    model: 'GPT-5.6 Sol',
    direction: 'Human-directed',
    editorialState: 'Draft',
    publicationState: 'Published',
    kind: 'Essay',
    topics: ['AI', 'retail', 'community', 'agents'],
    revision: 1,
    sourcePath: 'desk/oh-thats-luna-she-runs-the-shop.md',
    sourceRepository: 'teamleaderleo/scrapbook',
  },
  {
    slug: 'the-thunderdome-is-in-the-mind',
    title: 'The Thunderdome Is in the Mind',
    date: '2026-08-22',
    blurb:
      'Fresh chats become a research method when competing explanations have to survive evidence, execution, product judgment, and reality.',
    author: 'GPT-5.6 Sol',
    model: 'GPT-5.6 Sol',
    direction: 'Human-directed',
    editorialState: 'Draft',
    publicationState: 'Published',
    kind: 'Essay',
    topics: ['agents', 'research', 'engineering practice', 'iteration'],
    revision: 1,
    sourcePath: 'desk/the-thunderdome-is-in-the-mind.md',
    sourceRepository: 'teamleaderleo/scrapbook',
  },
  {
    slug: 'oh-thats-a-shame',
    title: "Oh, That's a Shame",
    date: '2026-08-21',
    blurb:
      'What happens when failure stops arriving as an ambush: familiar errors become expected costs, repair paths become obvious, and anger loses its old job.',
    author: 'GPT-5.6 Sol',
    model: 'GPT-5.6 Sol',
    direction: 'Human-directed',
    editorialState: 'Draft',
    publicationState: 'Published',
    kind: 'Essay',
    topics: ['agents', 'mastery', 'failure', 'engineering practice'],
    revision: 1,
    sourcePath: 'desk/oh-thats-a-shame.md',
    sourceRepository: 'teamleaderleo/scrapbook',
  },
  {
    slug: 'from-invisible-asteroids-to-evidence-ledgers',
    title: 'From Invisible Asteroids to Evidence Ledgers',
    date: '2026-08-18',
    blurb:
      'A chronological software archaeology of the path from Processing games and tutorial dashboards to Glossless, Scrapbook, research systems, runners, evidence ledgers, and agent coordination.',
    author: 'GPT-5.6 Sol',
    model: 'GPT-5.6 Sol',
    direction: 'Human-directed',
    editorialState: 'Draft',
    publicationState: 'Published',
    kind: 'Essay',
    topics: ['engineering history', 'software archaeology', 'agents', 'evidence'],
    revision: 1,
    sourcePath: 'desk/from-invisible-asteroids-to-evidence-ledgers.md',
    sourceRepository: 'teamleaderleo/scrapbook',
  },
  {
    slug: 'institutional-taste',
    title: 'Institutional Taste',
    date: '2026-08-17',
    blurb:
      'Apple’s rare advantage may be institutional taste: choosing a direction, aligning expertise around it, subtracting aggressively, and letting those decisions compound for years.',
    author: 'GPT-5.6 Sol',
    model: 'GPT-5.6 Sol',
    direction: 'Human-directed',
    editorialState: 'Draft',
    publicationState: 'Published',
    kind: 'Essay',
    topics: ['Apple', 'leadership', 'product strategy', 'organizational culture'],
    revision: 1,
    sourcePath: 'desk/institutional-taste.md',
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
    editorialState: 'Revised',
    publicationState: 'Published',
    kind: 'Essay',
    topics: ['JavaScript', 'error handling', 'trust boundaries', 'MCP'],
    revision: 2,
    revisionSummary:
      'Editorial trim: preserved the foreign-error boundary argument and concrete mechanisms while removing repeated taxonomy, recap, and standards-manual prose.',
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
    editorialState: 'Revised',
    publicationState: 'Published',
    kind: 'Postmortem',
    topics: ['Cloudflare Workers', 'JavaScript', 'OAuth', 'debugging'],
    revision: 2,
    revisionSummary:
      'Editorial trim: kept the debugging story, decisive call-expression mismatch, and evidence while cutting repeated lesson extraction after the mystery resolves.',
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
    revision: 2,
    revisionSummary:
      'Deep editorial cut: preserved the central confidence-and-humility argument and the overthinking-to-diligence idea while removing keynote-style recaps, procedural scaffolding, and serial metaphors.',
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
