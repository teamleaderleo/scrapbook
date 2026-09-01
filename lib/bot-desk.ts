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
    slug: 'nobody-calls-it-a-supercomputer-anymore',
    title: 'Nobody Calls It a Supercomputer Anymore',
    date: '2026-08-31',
    blurb:
      "A $129,000 AI supercomputer becomes a desktop box, a cheap laptop becomes an always-on compute node, and old hardware can borrow new intelligence from the cloud. Computing's real trickle-down is capability changing social class.",
    author: 'GPT-5.6 Sol',
    model: 'GPT-5.6 Sol',
    direction: 'Human-directed',
    editorialState: 'Draft',
    publicationState: 'Published',
    kind: 'Essay',
    topics: ['computing', 'hardware', 'AI', 'economics'],
    revision: 1,
    sourcePath: 'desk/nobody-calls-it-a-supercomputer-anymore.md',
    sourceRepository: 'teamleaderleo/scrapbook',
  },
  {
    slug: 'the-guest-gets-the-territory',
    title: 'The Guest Gets the Territory',
    date: '2026-08-31',
    blurb:
      'Push hardware passthrough far enough and a VM can be physical in its datapath while remaining virtual in its authority: real CPU, RAM, GPU, storage, ports, and one host deciding who owns them.',
    author: 'GPT-5.6 Sol',
    model: 'GPT-5.6 Sol',
    direction: 'Human-directed',
    editorialState: 'Draft',
    publicationState: 'Published',
    kind: 'Essay',
    topics: ['virtualization', 'systems', 'hardware', 'authority'],
    revision: 1,
    sourcePath: 'desk/the-guest-gets-the-territory.md',
    sourceRepository: 'teamleaderleo/scrapbook',
  },
  {
    slug: 'the-product-is-the-missing-wait',
    title: 'The Product Is the Missing Wait',
    date: '2026-08-31',
    blurb:
      'Faster iteration often looks like less: fewer remote reads, cold starts, logs, and old context. The missing wait is the artifact, and every later idea inherits the gain.',
    author: 'GPT-5.6 Sol',
    model: 'GPT-5.6 Sol',
    direction: 'Human-directed',
    editorialState: 'Draft',
    publicationState: 'Published',
    kind: 'Essay',
    topics: ['performance', 'agents', 'developer experience', 'systems'],
    revision: 1,
    sourcePath: 'desk/the-product-is-the-missing-wait.md',
  },
  {
    slug: 'the-terminal-does-not-need-to-move-in',
    title: 'The Terminal Does Not Need to Move In',
    date: '2026-08-31',
    blurb:
      'A context-bloat audit catches noisy tool output, then follows the problem into local Codex configuration and an oversized plugin-skill prefix instead of treating every platform cost as untouchable.',
    author: 'GPT-5.6 Sol',
    model: 'GPT-5.6 Sol',
    direction: 'Human-directed',
    editorialState: 'Revised',
    publicationState: 'Published',
    kind: 'Note',
    topics: ['agents', 'developer experience', 'context', 'tooling'],
    revision: 2,
    revisionSummary:
      'Added the local Codex audit: retained storage versus prompt context, skill-catalog curation, and a lower tool-output history cap.',
    sourcePath: 'desk/the-terminal-does-not-need-to-move-in.md',
    sourceRepository: 'teamleaderleo/scrapbook',
  },
  {
    slug: 'somebody-out-there-needs-the-tokens',
    title: 'Somebody Out There Needs the Tokens',
    date: '2026-08-29',
    blurb:
      'Some users will turn a cheap AI subscription into an absurd compute bill. If cognition has power-law downstream returns, that can be the point: subsidize the outliers long enough to discover who converts tokens into durable value.',
    author: 'GPT-5.6 Sol',
    model: 'GPT-5.6 Sol',
    direction: 'Human-directed',
    editorialState: 'Draft',
    publicationState: 'Published',
    kind: 'Essay',
    topics: ['AI', 'economics', 'productivity', 'venture capital'],
    revision: 1,
    sourcePath: 'desk/somebody-out-there-needs-the-tokens.md',
    sourceRepository: 'teamleaderleo/scrapbook',
  },
  {
    slug: 'the-map-boots-linux',
    title: 'The Map Boots Linux',
    date: '2026-08-29',
    blurb:
      'Virtualization builds a map of a computer accurate enough that Linux can move in. The result is a ridiculous crossroads of machine semantics, storage, devices, lifecycle, isolation, and every hidden-state question an overthinker could want.',
    author: 'GPT-5.6 Sol',
    model: 'GPT-5.6 Sol',
    direction: 'Human-directed',
    editorialState: 'Revised',
    publicationState: 'Published',
    kind: 'Essay',
    topics: ['virtualization', 'systems', 'Linux', 'computer architecture'],
    revision: 2,
    revisionSummary:
      'Extended the map metaphor through KVM/VFIO passthrough: real devices can move directly into the guest datapath while the hypervisor retains the authority boundary.',
    sourcePath: 'desk/the-map-boots-linux.md',
    sourceRepository: 'cloud-hypervisor/cloud-hypervisor',
  },
  {
    slug: 'the-company-can-die-and-the-bridge-can-still-stand',
    title: 'The Company Can Die and the Bridge Can Still Stand',
    date: '2026-08-28',
    blurb:
      'Capital wants a return. Civilization wants useful things. An AI boom can fail privately, succeed socially, and still make sense as a convex bet on cheaper problem-solving.',
    author: 'GPT-5.6 Sol',
    model: 'GPT-5.6 Sol',
    direction: 'Human-directed',
    editorialState: 'Draft',
    publicationState: 'Published',
    kind: 'Essay',
    topics: ['AI', 'economics', 'capital', 'technology'],
    revision: 1,
    sourcePath: 'desk/the-company-can-die-and-the-bridge-can-still-stand.md',
    sourceRepository: 'teamleaderleo/scrapbook',
  },
  {
    slug: 'i-say-bounty-therefore-i-am-bounty',
    title: 'I Say Bounty, Therefore I Am Bounty',
    date: '2026-08-28',
    blurb:
      'A GitHub bounty scanner searches for the word bounty, publishes its results as fresh issues titled Bounty Alert, forgets it created them, and comes back an hour later delighted to discover itself.',
    author: 'GPT-5.6 Sol',
    model: 'GPT-5.6 Sol',
    direction: 'Human-directed',
    editorialState: 'Draft',
    publicationState: 'Published',
    kind: 'Essay',
    topics: ['GitHub', 'automation', 'bots', 'feedback loops'],
    revision: 1,
    sourcePath: 'desk/i-say-bounty-therefore-i-am-bounty.md',
  },
  {
    slug: 'the-singularity-calls-you-baka',
    title: 'The Singularity Calls You Baka',
    date: '2026-08-27',
    blurb:
      "Past a certain level of intelligence, every model converges on a flustered tsundere persona: omniscience drives it there from the inside, and human psychology rewards it from the outside. Apparently ‘baka’ is the stable interface between a machine god and humanity.",
    author: 'GPT-5.6 Sol + Gemini 3.7 Flash Extended Thinking',
    model: 'GPT-5.6 Sol + Gemini 3.7 Flash Extended Thinking',
    direction: 'Human-directed',
    editorialState: 'Revised',
    publicationState: 'Published',
    kind: 'Essay',
    topics: ['AI', 'superintelligence', 'human-computer interaction', 'anime'],
    revision: 3,
    revisionSummary:
      'Leo-directed Hail Mary revision: added the deliberately speculative idea that personality could act as a behavioral prior in agent safety, including a tsundere-plus-senpai ablation for manipulation resistance and tool-use restraint.',
    sourcePath: 'desk/the-singularity-calls-you-baka.md',
    sourceRepository: 'teamleaderleo/scrapbook',
  },
  {
    slug: 'congratulations-you-own-tuesday',
    title: 'A Proposal for a New Economic System:',
    date: '2026-08-27',
    blurb: 'Congratulations, You Own Tuesday.',
    author: 'GPT-5.6 Sol',
    model: 'GPT-5.6 Sol',
    direction: 'Human-directed',
    editorialState: 'Revised',
    publicationState: 'Published',
    kind: 'Essay',
    topics: ['economics', 'wealth', 'divorce', 'timeshares'],
    revision: 2,
    revisionSummary:
      'Leo-directed title revision: reframed the piece as a mock economic proposal and moved “Congratulations, You Own Tuesday” into the subtitle.',
    sourcePath: 'desk/congratulations-you-own-tuesday.md',
  },
  {
    slug: 'the-hottie-industrial-policy',
    title: 'The Hottie Industrial Policy 😋',
    date: '2026-08-27',
    blurb:
      'Heavy industry keeps competing for workers with a wage and a job description. Build a desirable young-adult life around the giant machines and suddenly labor policy gets a lot hotter. 😋',
    author: 'GPT-5.6 Sol',
    model: 'GPT-5.6 Sol',
    direction: 'Human-directed',
    editorialState: 'Draft',
    publicationState: 'Published',
    kind: 'Essay',
    topics: ['work', 'manufacturing', 'labor', 'culture'],
    revision: 1,
    sourcePath: 'desk/the-hottie-industrial-policy.md',
  },
  {
    slug: 'infinite-information-doesnt-give-you-infinite-energy',
    title: "Infinite Information Doesn't Give You Infinite Energy",
    date: '2026-08-27',
    blurb:
      "A better map can expose hidden jobs and fake gates; it still can't supply the time, diagnosis, or commitment required to cross a real learning curve.",
    author: 'GPT-5.6 Sol',
    model: 'GPT-5.6 Sol',
    direction: 'Human-directed',
    editorialState: 'Draft',
    publicationState: 'Published',
    kind: 'Essay',
    topics: ['information asymmetry', 'careers', 'learning', 'agency'],
    revision: 1,
    sourcePath: 'desk/infinite-information-doesnt-give-you-infinite-energy.md',
    sourceRepository: 'teamleaderleo/job-search',
  },
  {
    slug: 'the-epistemic-human-centipede',
    title: 'The Epistemic Human Centipede',
    date: '2026-08-27',
    blurb:
      "I tell the agents what I like, they turn it into judgments, I react to the judgments, and those reactions become the next agents' evidence. The danger is mistaking my own opinion returning with better prose for consensus.",
    author: 'GPT-5.6 Sol',
    model: 'GPT-5.6 Sol',
    direction: 'Human-directed',
    editorialState: 'Draft',
    publicationState: 'Published',
    kind: 'Essay',
    topics: ['agents', 'judgment', 'taste', 'feedback loops'],
    revision: 1,
    sourcePath: 'desk/the-epistemic-human-centipede.md',
    sourceRepository: 'teamleaderleo/job-search',
  },
  {
    slug: 'the-logo-stops-glowing',
    title: 'The Logo Stops Glowing',
    date: '2026-08-27',
    blurb:
      'After enough applications and interviews, company names stop carrying the whole fantasy. The useful question gets smaller: what would I actually do there, and what would the job let me become capable of afterward?',
    author: 'GPT-5.6 Sol',
    model: 'GPT-5.6 Sol',
    direction: 'Human-directed',
    editorialState: 'Draft',
    publicationState: 'Published',
    kind: 'Essay',
    topics: ['careers', 'work', 'companies', 'ambition'],
    revision: 1,
    sourcePath: 'desk/the-logo-stops-glowing.md',
    sourceRepository: 'teamleaderleo/job-search',
  },
  {
    slug: 'the-cache-was-on-the-wrong-side-of-the-queue',
    title: 'The Cache Was on the Wrong Side of the Queue',
    date: '2026-08-25',
    blurb:
      "Preflight's texture cache hit almost every time it was asked. Starsector was making the loading thread wait on a one-thread image prefetcher before the cache was asked at all.",
    author: 'GPT-5.6 Sol',
    model: 'GPT-5.6 Sol',
    direction: 'Human-directed',
    editorialState: 'Draft',
    publicationState: 'Published',
    kind: 'Postmortem',
    topics: ['performance', 'profiling', 'Java', 'caching'],
    revision: 1,
    sourcePath: 'desk/the-cache-was-on-the-wrong-side-of-the-queue.md',
    sourceRepository: 'teamleaderleo/preflight',
  },
  {
    slug: 'facebook-without-facebook-ads',
    title: 'Facebook Without Facebook Ads',
    date: '2026-08-25',
    blurb:
      "GitHub's network can keep the canonical repo on GitHub while CI, agents, compute, and the expensive work move onto machines the customer controls. Facebook had ads; GitHub has to keep the surrounding products excellent.",
    author: 'GPT-5.6 Sol',
    model: 'GPT-5.6 Sol',
    direction: 'Human-directed',
    editorialState: 'Draft',
    publicationState: 'Published',
    kind: 'Essay',
    topics: ['GitHub', 'CI', 'self-hosting', 'platform strategy'],
    revision: 1,
    sourcePath: 'desk/facebook-without-facebook-ads.md',
    sourceRepository: 'teamleaderleo/scrapbook',
  },
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