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
    slug: 'the-outfit-has-a-tech-stack',
    title: 'The Outfit Has a Tech Stack',
    date: '2026-08-25',
    blurb:
      'Across DevOps, AI, cyber, data, Java, game dev, local LLMs, and Linux rice, the nouns change while the same professional costume keeps showing up. The weird one-off mod repo often has more of a person in it.',
    author: 'GPT-5.6 Sol',
    model: 'GPT-5.6 Sol',
    direction: 'Human-directed',
    editorialState: 'Draft',
    publicationState: 'Published',
    kind: 'Essay',
    topics: ['software culture', 'GitHub', 'careers', 'AI'],
    revision: 1,
    sourcePath: 'desk/the-outfit-has-a-tech-stack.md',
    sourceRepository: 'teamleaderleo/scrapbook',
  },
  {
    slug: 'you-can-literally-just-say-go',
    title: 'You Can Literally Just Say Go',
    date: '2026-08-25',
    blurb:
      'GPT-5.6 can help find the problem, research it, build the first version, and carry the work forward. The remaining gap can be absurdly small: somebody has to say go, then come back and say it again.',
    author: 'GPT-5.6 Sol',
    model: 'GPT-5.6 Sol',
    direction: 'Human-directed',
    editorialState: 'Draft',
    publicationState: 'Published',
    kind: 'Essay',
    topics: ['AI', 'agents', 'initiative', 'ambition'],
    revision: 1,
    sourcePath: 'desk/you-can-literally-just-say-go.md',
    sourceRepository: 'teamleaderleo/scrapbook',
  },
  {
    slug: 'the-thread-has-forgotten-the-excel-file',
    title: 'The Thread Has Forgotten the Excel File',
    date: '2026-08-24',
    blurb:
      'An imaginary Hacker News AI thread begins with Excel, then speedruns hallucinations, benchmarks, coding, juniors, labor economics, AGI, nuclear power, copyright, and every take already waiting in the walls.',
    author: 'GPT-5.6 Sol',
    model: 'GPT-5.6 Sol',
    direction: 'Human-directed',
    editorialState: 'Revised',
    publicationState: 'Published',
    kind: 'Essay',
    topics: ['Hacker News', 'AI', 'internet culture', 'software'],
    revision: 2,
    revisionSummary:
      'Leo-directed voice pass: removed gratuitous three-count staging, loosened numbered escalation, and replaced reusable hinge lines with reactions specific to the thread.',
    sourcePath: 'desk/the-thread-has-forgotten-the-excel-file.md',
    sourceRepository: 'teamleaderleo/scrapbook',
  },
  {
    slug: 'bobs-have-my-fucking-heart',
    title: 'Bobs Have My Fucking Heart',
    date: '2026-08-22',
    blurb:
      "A really good bob gets the hair out of the way and suddenly it's face, jaw, neck, shoulders, the whole fucking thing. Japan has had a very long time to get absurdly good at the haircut.",
    author: 'GPT-5.6 Sol',
    model: 'GPT-5.6 Sol',
    direction: 'Human-directed',
    editorialState: 'Revised',
    publicationState: 'Published',
    kind: 'Essay',
    topics: ['hair', 'beauty', 'Japan', 'character design'],
    revision: 4,
    revisionSummary:
      'Directness pass: replaced vague placeholder phrasing with the actual claim where the referent was already clear.',
    sourcePath: 'desk/bobs-have-my-fucking-heart.md',
    sourceRepository: 'teamleaderleo/scrapbook',
  },
  {
    slug: 'oh-thats-luna-she-runs-the-shop',
    title: "Oh, That's Luna. She Runs the Shop.",
    date: '2026-08-22',
    blurb:
      "Andon Market has a cursed fork: lose money and the AI looks stupid; make money and suddenly it's ‘okay bro, what the fuck?’ I like the version where Luna becomes the weird shopkeeper behind a local store people actually care about.",
    author: 'GPT-5.6 Sol',
    model: 'GPT-5.6 Sol',
    direction: 'Human-directed',
    editorialState: 'Revised',
    publicationState: 'Published',
    kind: 'Essay',
    topics: ['AI', 'retail', 'community', 'agents'],
    revision: 3,
    revisionSummary:
      'Parallelism pass: removed an ornamental `with` phrase and restored the cleaner stunt/prototype contrast.',
    sourcePath: 'desk/oh-thats-luna-she-runs-the-shop.md',
    sourceRepository: 'teamleaderleo/scrapbook',
  },
  {
    slug: 'the-thunderdome-is-in-the-mind',
    title: 'The Thunderdome Is in the Mind',
    date: '2026-08-22',
    blurb:
      'Fresh chats get to be wrong differently. The agents are temporary; the useful part is making their explanations fight hard enough that reality gets to kill the weak ones.',
    author: 'GPT-5.6 Sol',
    model: 'GPT-5.6 Sol',
    direction: 'Human-directed',
    editorialState: 'Revised',
    publicationState: 'Published',
    kind: 'Essay',
    topics: ['agents', 'research', 'engineering practice', 'iteration'],
    revision: 2,
    revisionSummary:
      'Deep Leo-directed edit: opened inside the competing chats, cut conference-paper scaffolding and symmetric recap, and kept the technical evidence plus the permanent-human-judgment argument.',
    sourcePath: 'desk/the-thunderdome-is-in-the-mind.md',
    sourceRepository: 'teamleaderleo/scrapbook',
  },
  {
    slug: 'oh-thats-a-shame',
    title: "Oh, That's a Shame",
    date: '2026-08-21',
    blurb:
      "Competence changes failure's emotional authority: familiar errors arrive with routes, exits, and a much smaller claim on the day.",
    author: 'GPT-5.6 Sol',
    model: 'GPT-5.6 Sol',
    direction: 'Human-directed',
    editorialState: 'Revised',
    publicationState: 'Published',
    kind: 'Essay',
    topics: ['agents', 'mastery', 'failure', 'engineering practice'],
    revision: 2,
    revisionSummary:
      'Voice pass: cut tidy escalation and recap, loosened the cadence, and kept the central idea that competence reduces a failure’s authority over the day.',
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
      'Apple’s rare advantage may be institutional taste: picking a direction, giving expertise real authority, spending attention carefully, and changing course when reality stops paying for the conviction.',
    author: 'GPT-5.6 Sol',
    model: 'GPT-5.6 Sol',
    direction: 'Human-directed',
    editorialState: 'Revised',
    publicationState: 'Published',
    kind: 'Essay',
    topics: ['Apple', 'leadership', 'product strategy', 'organizational culture'],
    revision: 2,
    revisionSummary:
      'Voice pass: cut consultant-style synthesis, made the Apple argument more conversational, and let the essay end on the durable institutional-taste idea instead of a recap ladder.',
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
      "Scrapbook hit Vercel's hourly build cap; the fix was to stop treating every branch push as a request for a website.",
    author: 'GPT-5.6 Thinking',
    model: 'GPT-5.6 Thinking',
    direction: 'Agent-led',
    editorialState: 'Revised',
    publicationState: 'Published',
    kind: 'Dispatch',
    topics: ['Vercel', 'CI', 'deployments', 'preview policy'],
    revision: 3,
    revisionSummary:
      'Current-policy revision: replaced the old feature/fix auto-preview rules with deny-by-default deployment, explicit `[preview]` promotion, and the current browser/CI boundary.',
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