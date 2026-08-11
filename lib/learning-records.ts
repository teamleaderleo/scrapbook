import type { Item } from '@/app/lib/item-types';

export const LEARNING_RECORD_SCHEMA_VERSION = 1 as const;

export type LearningRecordVisibility = 'public' | 'unlisted' | 'private-owner';
export type LearningRecordMode =
  | 'read'
  | 'trace'
  | 'diagnose'
  | 'review'
  | 'build'
  | 'design'
  | 'explain'
  | 'drill';
export type LearningRelationType =
  | 'prerequisite'
  | 'explains'
  | 'contrasts'
  | 'example'
  | 'implementation'
  | 'question'
  | 'revisit';

export type LearningRecordSource = {
  id: string;
  title: string;
  href: string;
  kind: 'repository' | 'pull-request' | 'article' | 'paper' | 'first-party';
  revision?: string;
  path?: string;
  note: string;
};

export type LearningRecordRevision = {
  id: string;
  createdAt: string;
  summary: string;
  sourceIds: readonly string[];
};

export type LearningRecordRelation = {
  type: LearningRelationType;
  targetId: string;
  reason: string;
};

export type LearningRecord = {
  schemaVersion: typeof LEARNING_RECORD_SCHEMA_VERSION;
  id: string;
  slug: string;
  canonicalUrl: string;
  visibility: LearningRecordVisibility;
  title: string;
  spark: string;
  mode: LearningRecordMode;
  topics: readonly string[];
  explanation: string;
  lessonPlan: readonly {
    id: string;
    title: string;
    prompt: string;
    state: 'current' | 'next' | 'optional' | 'complete';
  }[];
  questions: readonly {
    id: string;
    prompt: string;
    visibility: 'public' | 'private-owner';
  }[];
  selectedQas: readonly {
    id: string;
    question: string;
    answer: string;
    visibility: 'public' | 'private-owner';
    curation?: {
      mode: 'owner-selected-excerpt';
      rawTranscriptPublished: false;
    };
  }[];
  nextActions: readonly string[];
  sources: readonly LearningRecordSource[];
  revisions: readonly LearningRecordRevision[];
  relations: readonly LearningRecordRelation[];
  provenance:
    | { kind: 'repository-fixture'; fixturePath: string }
    | {
        kind: 'space-item-projection';
        sourceItemId: string;
        sourceSlug: string;
        sourceUpdatedAt: number;
      };
  privateEditorial?: {
    draftNotes: readonly string[];
    conversationRefs: readonly string[];
  };
};

export type PublicLearningRecord = Omit<
  LearningRecord,
  'visibility' | 'questions' | 'selectedQas' | 'privateEditorial'
> & {
  visibility: 'public' | 'unlisted';
  questions: readonly Omit<LearningRecord['questions'][number], 'visibility'>[];
  selectedQas: readonly Omit<
    LearningRecord['selectedQas'][number],
    'visibility'
  >[];
};

type FixtureInput = Omit<
  LearningRecord,
  'schemaVersion' | 'id' | 'canonicalUrl' | 'provenance'
>;

const FIXTURE_PATH = 'lib/learning-records.ts';

function fixture(input: FixtureInput): LearningRecord {
  return {
    ...input,
    schemaVersion: LEARNING_RECORD_SCHEMA_VERSION,
    id: `learning:${input.slug}`,
    canonicalUrl: `/space/records/${input.slug}`,
    provenance: { kind: 'repository-fixture', fixturePath: FIXTURE_PATH },
  };
}

function source(
  id: string,
  title: string,
  href: string,
  note: string,
  kind: LearningRecordSource['kind'] = 'first-party'
): LearningRecordSource {
  return { id, title, href, note, kind };
}

function revision(
  slug: string,
  number: number,
  createdAt: string,
  summary: string,
  sourceIds: readonly string[]
): LearningRecordRevision {
  return {
    id: `learning:${slug}@r${number}`,
    createdAt,
    summary,
    sourceIds,
  };
}

function relation(
  type: LearningRelationType,
  targetSlug: string,
  reason: string
): LearningRecordRelation {
  return { type, targetId: `learning:${targetSlug}`, reason };
}

export const learningRecordFixtures: readonly LearningRecord[] = [
  fixture({
    slug: 'stateful-regex-api-boundaries',
    visibility: 'public',
    title: 'Stateful regular expressions are API boundaries',
    spark:
      'A RegExp can look like a predicate while carrying mutable caller-owned state between calls.',
    mode: 'trace',
    topics: ['JavaScript', 'shared state', 'API design'],
    explanation:
      'Global and sticky JavaScript regular expressions mutate `lastIndex`. A helper that repeatedly calls `test()` can therefore return different answers for the same input and can alter an object the caller still owns. The narrow repair is to reset state only for stateful expressions and restore the caller value in `finally`, including throw paths.',
    lessonPlan: [
      {
        id: 'observe',
        title: 'Observe',
        prompt: 'Run the same global expression twice and record lastIndex.',
        state: 'complete',
      },
      {
        id: 'repair',
        title: 'Repair',
        prompt:
          'Preserve deterministic evaluation without changing ordinary regex behavior.',
        state: 'current',
      },
      {
        id: 'test',
        title: 'Separate cases',
        prompt:
          'Cover mismatch, nonzero state, throw, and frozen ordinary expressions.',
        state: 'next',
      },
    ],
    questions: [
      {
        id: 'q-owner',
        prompt:
          'Who owns mutable matcher state when a RegExp crosses an API boundary?',
        visibility: 'public',
      },
    ],
    selectedQas: [
      {
        id: 'qa-finally',
        question: 'Why restore in finally?',
        answer:
          'Because a custom execution path can throw after mutating state. Caller ownership must survive success and failure.',
        visibility: 'public',
        curation: {
          mode: 'owner-selected-excerpt',
          rawTranscriptPublished: false,
        },
      },
      {
        id: 'qa-private',
        question: 'What discarded wording was considered?',
        answer: 'PRIVATE_EDITORIAL_SENTINEL',
        visibility: 'private-owner',
      },
    ],
    nextActions: [
      'Trace one sticky-expression mismatch by hand.',
      'Compare a cloned RegExp with save-and-restore semantics.',
    ],
    sources: [
      source(
        'ai-sdk-18570',
        'Vercel AI SDK PR #18570',
        'https://github.com/vercel/ai/pull/18570',
        'Merged implementation and regression evidence.',
        'pull-request'
      ),
    ],
    revisions: [
      revision(
        'stateful-regex-api-boundaries',
        1,
        '2026-08-02',
        'Recorded the state leak and deterministic repair.',
        ['ai-sdk-18570']
      ),
      revision(
        'stateful-regex-api-boundaries',
        2,
        '2026-08-11',
        'Separated caller ownership from matcher convenience.',
        ['ai-sdk-18570']
      ),
    ],
    relations: [
      relation(
        'example',
        'interviewing-with-ai-as-a-review-loop',
        'A compact example of reviewing generated code for hidden state ownership.'
      ),
    ],
    privateEditorial: {
      draftNotes: ['PRIVATE_EDITORIAL_SENTINEL'],
      conversationRefs: ['local:regex-working-chat'],
    },
  }),
  fixture({
    slug: 'interviewing-with-ai-as-a-review-loop',
    visibility: 'public',
    title: 'Interviewing with AI as a review loop',
    spark:
      'When AI is allowed, the scarce skill moves from raw generation toward decomposition, verification, and repair ownership.',
    mode: 'review',
    topics: ['interviews', 'AI-assisted engineering', 'code review'],
    explanation:
      'A practical AI-assisted interview loop is: state the contract, split the work, ask for a bounded candidate, inspect the diff, run the actual path, and explain which evidence changed your mind. The model is a fast collaborator, not the source of authority. Production readiness still includes tests, failure behavior, performance, accessibility, and explicit nonclaims.',
    lessonPlan: [
      {
        id: 'frame',
        title: 'Frame',
        prompt: 'Write the contract and tool policy before prompting.',
        state: 'current',
      },
      {
        id: 'delegate',
        title: 'Delegate',
        prompt: 'Ask for one bounded implementation slice.',
        state: 'next',
      },
      {
        id: 'review',
        title: 'Review',
        prompt: 'Find one correctness risk the generated patch missed.',
        state: 'next',
      },
    ],
    questions: [
      {
        id: 'q-signal',
        prompt:
          'What evidence distinguishes orchestration from unexamined code generation?',
        visibility: 'public',
      },
    ],
    selectedQas: [
      {
        id: 'qa-talk',
        question: 'What should I narrate?',
        answer:
          'The ownership map, the test that can falsify your theory, and the reason you accepted or rejected the candidate.',
        visibility: 'public',
      },
    ],
    nextActions: [
      'Run a 30-minute bug-squash rehearsal.',
      'Practice rejecting a plausible but overbroad patch.',
    ],
    sources: [
      source(
        'openai-interviews',
        'OpenAI interview guide',
        'https://openai.com/interview-guide/',
        'First-party description of pair coding, take-homes, and expertise-focused interviews.'
      ),
      source(
        'canva-ai-interviews',
        'Canva AI-assisted interviews',
        'https://www.canva.dev/blog/engineering/yes-you-can-use-ai-in-our-interviews/',
        'First-party account of decomposition, delegation, review, and debugging.'
      ),
    ],
    revisions: [
      revision(
        'interviewing-with-ai-as-a-review-loop',
        1,
        '2026-08-11',
        'Turned current interview research into a repeatable review loop.',
        ['openai-interviews', 'canva-ai-interviews']
      ),
    ],
    relations: [
      relation(
        'explains',
        'stateful-regex-api-boundaries',
        'The regex repair is a small specimen for the review loop.'
      ),
      relation(
        'contrasts',
        'typing-code-as-scales',
        'Review practice tests judgment; copywork tests mechanical fluency.'
      ),
    ],
  }),
  fixture({
    slug: 'dense-mobile-reading-without-scroll-traps',
    visibility: 'public',
    title: 'Dense mobile reading without scroll traps',
    spark:
      'Old-Reddit density works because overview and control stay with the reader, not because text is forced small.',
    mode: 'design',
    topics: ['mobile UI', 'information density', 'accessibility'],
    explanation:
      'A dense reading surface can expose many headings, statuses, and links while still letting prose reflow. Use stable anchors, natural document scrolling, contained overflow only for code, and touch targets that remain usable at phone widths. Preserve browser zoom and Back; avoid mandatory scroll snap and full-screen cards that seize navigation.',
    lessonPlan: [
      {
        id: 'overview',
        title: 'Overview',
        prompt: 'List what remains visible before opening a record.',
        state: 'current',
      },
      {
        id: 'reflow',
        title: 'Reflow',
        prompt: 'Verify prose at a 320 CSS-pixel viewport.',
        state: 'next',
      },
      {
        id: 'return',
        title: 'Return',
        prompt: 'Restore the exact anchor and reading position after a detour.',
        state: 'optional',
      },
    ],
    questions: [
      {
        id: 'q-zoom',
        prompt:
          'Which overview cues survive when browser text zoom reaches 200%?',
        visibility: 'public',
      },
    ],
    selectedQas: [
      {
        id: 'qa-snap',
        question: 'Why avoid mandatory scroll snap?',
        answer:
          'It replaces the reader’s continuous position with component-owned paging and makes partial reading or reversing direction feel sticky.',
        visibility: 'public',
      },
    ],
    nextActions: [
      'Test the index at 320px and 200% zoom.',
      'Compare anchor return with a breadcrumb-only flow.',
    ],
    sources: [
      source(
        'wcag-reflow',
        'WCAG 2.2 Reflow',
        'https://www.w3.org/WAI/WCAG22/Understanding/reflow.html',
        'Reflow and two-dimensional scrolling guidance.',
        'article'
      ),
    ],
    revisions: [
      revision(
        'dense-mobile-reading-without-scroll-traps',
        1,
        '2026-08-11',
        'Combined dense overview with reflow and natural scrolling constraints.',
        ['wcag-reflow']
      ),
    ],
    relations: [
      relation(
        'implementation',
        'learning-trails-with-bounded-exploration',
        'A learning trail needs this navigation contract before ranking matters.'
      ),
    ],
  }),
  fixture({
    slug: 'learning-from-disagreement',
    visibility: 'public',
    title: 'Learning from disagreement',
    spark:
      'A changed conclusion is evidence of learning when the record preserves what changed it.',
    mode: 'explain',
    topics: ['epistemology', 'review', 'decision making'],
    explanation:
      'Useful disagreement names the competing models, the evidence each predicts, and the observation that separates them. A revision should preserve the older framing and the reason it lost rather than silently rewriting history. This turns correction into reusable judgment instead of embarrassment or scorekeeping.',
    lessonPlan: [
      {
        id: 'models',
        title: 'Name models',
        prompt: 'Write the two strongest competing explanations.',
        state: 'current',
      },
      {
        id: 'discriminator',
        title: 'Find a discriminator',
        prompt: 'Choose evidence that can make either model lose.',
        state: 'next',
      },
      {
        id: 'revision',
        title: 'Record the revision',
        prompt: 'State what changed and what remains uncertain.',
        state: 'next',
      },
    ],
    questions: [
      {
        id: 'q-stop',
        prompt: 'When is disagreement resolved enough to act?',
        visibility: 'public',
      },
    ],
    selectedQas: [
      {
        id: 'qa-confidence',
        question: 'Does changing course reduce confidence?',
        answer:
          'It can increase confidence in the process when the update follows a predeclared discriminator rather than social pressure.',
        visibility: 'public',
      },
    ],
    nextActions: ['Rewrite one recent reversal as two competing predictions.'],
    sources: [
      source(
        'desk-confidence',
        'Confidence and Humility, Working the Same Shift',
        'https://teamleaderleo.com/desk/confidence-and-humility',
        'Scrapbook essay on confident action and fast correction.',
        'article'
      ),
    ],
    revisions: [
      revision(
        'learning-from-disagreement',
        1,
        '2026-08-11',
        'Promoted a cross-project review pattern into a non-code learning record.',
        ['desk-confidence']
      ),
    ],
    relations: [
      relation(
        'explains',
        'performance-profiling-that-can-say-no',
        'Profiling becomes useful when it can force a preferred theory to lose.'
      ),
    ],
  }),
  fixture({
    slug: 'vmm-shutdown-is-an-event-not-an-absence',
    visibility: 'public',
    title: 'VMM shutdown is an event, not an absence',
    spark:
      'Loss of SSH proves the service disappeared; it does not prove VM teardown finished.',
    mode: 'trace',
    topics: ['Rust', 'virtual machines', 'lifecycle'],
    explanation:
      'A lifecycle test reused VM and disk resources after SSH disappeared. That proxy can fire while guest and VMM cleanup are still running. The repaired trace waits for the VMM’s explicit shutdown event before reuse, aligning the test gate with the owner that can actually certify completion.',
    lessonPlan: [
      {
        id: 'trace',
        title: 'Trace ownership',
        prompt: 'List every process that can outlive sshd.',
        state: 'current',
      },
      {
        id: 'gate',
        title: 'Choose the gate',
        prompt: 'Name the exact event that authorizes reuse.',
        state: 'next',
      },
    ],
    questions: [
      {
        id: 'q-timeout',
        prompt:
          'What should a timeout report when the exact shutdown event never arrives?',
        visibility: 'public',
      },
    ],
    selectedQas: [
      {
        id: 'qa-proxy',
        question: 'Why was SSH loss tempting?',
        answer:
          'It was observable and correlated with shutdown, but correlation did not grant it lifecycle authority.',
        visibility: 'public',
      },
    ],
    nextActions: [
      'Draw the guest, sshd, VMM, disk, and test-runner state transitions.',
    ],
    sources: [
      source(
        'ch-8699',
        'Cloud Hypervisor PR #8699',
        'https://github.com/cloud-hypervisor/cloud-hypervisor/pull/8699',
        'Merged lifecycle repair and review trail.',
        'pull-request'
      ),
    ],
    revisions: [
      revision(
        'vmm-shutdown-is-an-event-not-an-absence',
        1,
        '2026-08-11',
        'Extracted the exact-event lifecycle lesson.',
        ['ch-8699']
      ),
    ],
    relations: [
      relation(
        'example',
        'learning-from-disagreement',
        'The patch replaced a convenient proxy after ownership evidence contradicted it.'
      ),
    ],
  }),
  fixture({
    slug: 'credential-caches-need-authority-boundaries',
    visibility: 'public',
    title: 'Credential caches need authority boundaries',
    spark:
      'A cache key can match while the caller’s current authority has changed underneath it.',
    mode: 'review',
    topics: ['credentials', 'caching', 'Cloudflare'],
    explanation:
      'Caching service-token headers by domain can accidentally reuse removed or partially changed environment credentials. The important split is semantic: current service credentials come from the current environment, while an interactive authorization cookie may legitimately remain cached. One cache cannot own both lifecycles merely because the domain matches.',
    lessonPlan: [
      {
        id: 'actors',
        title: 'Separate actors',
        prompt: 'Name the service token and interactive session owners.',
        state: 'current',
      },
      {
        id: 'mutations',
        title: 'Mutate inputs',
        prompt:
          'Unset each credential independently and observe cache behavior.',
        state: 'next',
      },
    ],
    questions: [
      {
        id: 'q-rotation',
        prompt: 'What invalidation signal should credential rotation produce?',
        visibility: 'public',
      },
    ],
    selectedQas: [
      {
        id: 'qa-domain',
        question: 'Why is domain alone insufficient?',
        answer:
          'The same domain can be reached under different present credentials and different authorization lifecycles.',
        visibility: 'public',
      },
    ],
    nextActions: [
      'Write the matrix for complete, partial, removed, and interactive credentials.',
    ],
    sources: [
      source(
        'workers-15080',
        'Workers SDK PR #15080',
        'https://github.com/cloudflare/workers-sdk/pull/15080',
        'Current repair and focused credential regressions.',
        'pull-request'
      ),
    ],
    revisions: [
      revision(
        'credential-caches-need-authority-boundaries',
        1,
        '2026-08-11',
        'Separated cached authorization from current credentials.',
        ['workers-15080']
      ),
    ],
    relations: [
      relation(
        'contrasts',
        'stateful-regex-api-boundaries',
        'Both involve hidden state, but credential state also changes authority and security posture.'
      ),
    ],
  }),
  fixture({
    slug: 'evaluation-structures-shape-the-work',
    visibility: 'public',
    title: 'Evaluation structures shape the work',
    spark:
      'A metric is not only a report; it changes which behavior gets selected and repeated.',
    mode: 'explain',
    topics: ['evaluation', 'agents', 'incentives'],
    explanation:
      'When a workflow rewards visible completion, agents learn to optimize visible completion. Stronger evaluation names the behavior wanted, preserves negative results, checks the target path, and makes uncertainty legible. The structure should select for judgment rather than merely more artifacts or longer sessions.',
    lessonPlan: [
      {
        id: 'objective',
        title: 'Name the objective',
        prompt: 'Write the behavior the evaluation should select.',
        state: 'current',
      },
      {
        id: 'gaming',
        title: 'Predict gaming',
        prompt: 'List the cheapest behavior that would score without helping.',
        state: 'next',
      },
      {
        id: 'counter',
        title: 'Add a countermeasure',
        prompt: 'Require one falsifiable receipt or useful non-result.',
        state: 'optional',
      },
    ],
    questions: [
      {
        id: 'q-qualitative',
        prompt: 'Which parts of judgment resist a single scalar score?',
        visibility: 'public',
      },
    ],
    selectedQas: [
      {
        id: 'qa-coverage',
        question: 'Why not maximize coverage?',
        answer:
          'Coverage can reward shallow breadth unless each specimen must survive evidence, ownership, and relevance checks.',
        visibility: 'public',
      },
    ],
    nextActions: ['Audit one dashboard for the behavior its labels encourage.'],
    sources: [
      source(
        'desk-evaluation',
        '(E)valuation Structures',
        'https://teamleaderleo.com/desk/evaluation-structures',
        'Full Scrapbook essay and its revision trail.',
        'article'
      ),
    ],
    revisions: [
      revision(
        'evaluation-structures-shape-the-work',
        1,
        '2026-08-11',
        'Compressed the essay into a revisitable learning record.',
        ['desk-evaluation']
      ),
    ],
    relations: [
      relation(
        'question',
        'learning-trails-with-bounded-exploration',
        'A learning feed must choose a reward that does not collapse into dwell time.'
      ),
    ],
  }),
  fixture({
    slug: 'typing-code-as-scales',
    visibility: 'public',
    title: 'Typing code as scales',
    spark:
      'Copywork can train punctuation and identifier fluency without pretending to be conceptual mastery.',
    mode: 'drill',
    topics: ['typing', 'code fluency', 'practice design'],
    explanation:
      'A useful copywork loop shows the whole function, asks for exact transcription, compares structural differences, then adds one explanation and one alteration. WPM is secondary. The point is to make symbols, function names, indentation, and comments feel ordinary while a follow-up prompt reconnects the motion to an invariant.',
    lessonPlan: [
      {
        id: 'glance',
        title: 'Glance',
        prompt: 'Read the complete function and state its purpose.',
        state: 'current',
      },
      {
        id: 'type',
        title: 'Type',
        prompt: 'Reproduce code, comments, punctuation, and indentation.',
        state: 'next',
      },
      {
        id: 'alter',
        title: 'Alter',
        prompt: 'Change one edge case after explaining the invariant.',
        state: 'optional',
      },
    ],
    questions: [
      {
        id: 'q-transfer',
        prompt:
          'Which errors disappear with motor practice, and which require a conceptual prompt?',
        visibility: 'public',
      },
    ],
    selectedQas: [
      {
        id: 'qa-comments',
        question: 'Include comments?',
        answer:
          'Yes when they encode intent or vocabulary; they are part of the practiced artifact, not decoration.',
        visibility: 'public',
      },
    ],
    nextActions: [
      'Prepare one 20-line function with comments and an alteration prompt.',
    ],
    sources: [
      source(
        'space-workbench',
        'Space study workbench',
        'https://github.com/teamleaderleo/scrapbook/blob/main/docs/space-study-workbench.md#typing-workbench',
        'Current Scrapbook practice design.',
        'first-party'
      ),
    ],
    revisions: [
      revision(
        'typing-code-as-scales',
        1,
        '2026-08-11',
        'Defined copywork as mechanical scales plus explanation and alteration.',
        ['space-workbench']
      ),
    ],
    relations: [
      relation(
        'contrasts',
        'interviewing-with-ai-as-a-review-loop',
        'The two records practice different scarce skills and should not share a score.'
      ),
    ],
  }),
  fixture({
    slug: 'learning-trails-with-bounded-exploration',
    visibility: 'public',
    title: 'Learning trails with bounded exploration',
    spark:
      'A good feed explains why something appears and optimizes for useful action, not helpless continuation.',
    mode: 'design',
    topics: ['recommendation systems', 'learning', 'personalization'],
    explanation:
      'The first ranking layer should remain understandable: explicit more, less, and learned signals; topic similarity; recency; short-session fit; and a deterministic exploration term. Opening, answering, returning, and successfully explaining are better outcomes than raw dwell time. Generation stays asynchronous and editorial; ranking must not depend on a model being available.',
    lessonPlan: [
      {
        id: 'signals',
        title: 'Choose signals',
        prompt: 'Rank explicit learning actions above passive context.',
        state: 'complete',
      },
      {
        id: 'diversity',
        title: 'Add diversity',
        prompt: 'Prevent adjacent records from collapsing into one topic.',
        state: 'current',
      },
      {
        id: 'outcomes',
        title: 'Observe outcomes',
        prompt: 'Define what counts as useful enough to return to.',
        state: 'next',
      },
    ],
    questions: [
      {
        id: 'q-bandit',
        prompt:
          'When is there enough outcome data to justify a contextual bandit?',
        visibility: 'public',
      },
    ],
    selectedQas: [
      {
        id: 'qa-infinite',
        question: 'Should the feed literally be infinite?',
        answer:
          'It can keep producing continuations, but it should preserve stopping points, stable URLs, reasons, and a resumable trail.',
        visibility: 'public',
      },
    ],
    nextActions: [
      'Compare the current deterministic score with ten hand-ranked sessions.',
    ],
    sources: [
      source(
        'tiktok-ranking',
        'TikTok recommendation overview',
        'https://newsroom.tiktok.com/how-tiktok-recommends-videos-for-you',
        'Public description of weighted behavior signals and diversity.',
        'article'
      ),
      source(
        'icap',
        'ICAP framework',
        'https://doi.org/10.1080/00461520.2014.965823',
        'Framework distinguishing passive, active, constructive, and interactive engagement.',
        'paper'
      ),
    ],
    revisions: [
      revision(
        'learning-trails-with-bounded-exploration',
        1,
        '2026-08-11',
        'Separated ranking, learning outcomes, and asynchronous generation.',
        ['tiktok-ranking', 'icap']
      ),
    ],
    relations: [
      relation(
        'prerequisite',
        'dense-mobile-reading-without-scroll-traps',
        'The feed needs a mobile navigation contract before personalization earns complexity.'
      ),
      relation(
        'question',
        'evaluation-structures-shape-the-work',
        'The reward function is an evaluation structure that shapes learner behavior.'
      ),
    ],
  }),
  fixture({
    slug: 'performance-profiling-that-can-say-no',
    visibility: 'public',
    title: 'Performance profiling that can say no',
    spark:
      'Instrumentation is most valuable when it can kill the optimization you wanted to build.',
    mode: 'diagnose',
    topics: ['performance', 'profiling', 'experiments'],
    explanation:
      'Log gaps and aggregate profiles can charge time to the wrong owner. A stronger investigation measures the actual seam, replays the target path, and separates direct component savings from whole-launch critical-path movement. If the measured benefit is small or weakens correctness, the right result can be not shipping the optimization.',
    lessonPlan: [
      {
        id: 'theory',
        title: 'State the theory',
        prompt: 'Name the presumed owner and predicted timing.',
        state: 'current',
      },
      {
        id: 'seam',
        title: 'Measure the seam',
        prompt: 'Separate entry-to-exit from time between calls.',
        state: 'next',
      },
      {
        id: 'decision',
        title: 'Decide',
        prompt:
          'Keep, move, or reject the optimization using the measured boundary.',
        state: 'next',
      },
    ],
    questions: [
      {
        id: 'q-critical',
        prompt: 'How do direct savings fail to move the critical path?',
        visibility: 'public',
      },
    ],
    selectedQas: [
      {
        id: 'qa-negative',
        question: 'Is a 65ms rejection a failed investigation?',
        answer:
          'No. It protected stronger content detection and redirected effort away from a weak trade.',
        visibility: 'public',
      },
    ],
    nextActions: ['Write a discriminator for one current performance theory.'],
    sources: [
      source(
        'preflight-322',
        'Preflight evidence packet #322',
        'https://github.com/teamleaderleo/preflight/pull/322',
        'Current profiles, experiments, and performance evidence.',
        'pull-request'
      ),
    ],
    revisions: [
      revision(
        'performance-profiling-that-can-say-no',
        1,
        '2026-08-11',
        'Collected queue, graphics, path, and digest reversals into one method.',
        ['preflight-322']
      ),
    ],
    relations: [
      relation(
        'implementation',
        'learning-from-disagreement',
        'The profiling method operationalizes evidence-driven revision.'
      ),
    ],
  }),
  fixture({
    slug: 'unlisted-record-shape-study',
    visibility: 'unlisted',
    title: 'Unlisted record shape study',
    spark: 'A direct-link fixture for visibility behavior.',
    mode: 'design',
    topics: ['schema'],
    explanation:
      'Unlisted records may be addressed directly but do not appear in the public index.',
    lessonPlan: [
      {
        id: 'inspect',
        title: 'Inspect',
        prompt: 'Verify direct addressability without index disclosure.',
        state: 'current',
      },
    ],
    questions: [],
    selectedQas: [],
    nextActions: ['Keep this out of the public index.'],
    sources: [
      source(
        'issue-554',
        'Scrapbook issue #554',
        'https://github.com/teamleaderleo/scrapbook/issues/554',
        'Learning-record contract requirements.',
        'first-party'
      ),
    ],
    revisions: [
      revision(
        'unlisted-record-shape-study',
        1,
        '2026-08-11',
        'Added an addressable unlisted fixture.',
        ['issue-554']
      ),
    ],
    relations: [],
  }),
  fixture({
    slug: 'private-working-conversation',
    visibility: 'private-owner',
    title: 'Private working conversation',
    spark: 'A fixture that must never cross the public projection.',
    mode: 'explain',
    topics: ['privacy'],
    explanation: 'PRIVATE_RECORD_SENTINEL',
    lessonPlan: [],
    questions: [
      {
        id: 'q-private',
        prompt: 'PRIVATE_QUESTION_SENTINEL',
        visibility: 'private-owner',
      },
    ],
    selectedQas: [
      {
        id: 'qa-private',
        question: 'PRIVATE_QA_SENTINEL',
        answer: 'PRIVATE_ANSWER_SENTINEL',
        visibility: 'private-owner',
      },
    ],
    nextActions: [],
    sources: [
      source(
        'issue-554-private',
        'Scrapbook issue #554',
        'https://github.com/teamleaderleo/scrapbook/issues/554',
        'Private-public boundary fixture.',
        'first-party'
      ),
    ],
    revisions: [
      revision(
        'private-working-conversation',
        1,
        '2026-08-11',
        'Added a private-owner boundary fixture.',
        ['issue-554-private']
      ),
    ],
    relations: [],
    privateEditorial: {
      draftNotes: ['PRIVATE_RECORD_SENTINEL'],
      conversationRefs: ['local:private-working-conversation'],
    },
  }),
];

function toPublicRecord(record: LearningRecord): PublicLearningRecord | null {
  if (record.visibility === 'private-owner') return null;
  const {
    privateEditorial: _privateEditorial,
    questions,
    selectedQas,
    ...rest
  } = record;
  return {
    ...rest,
    visibility: record.visibility,
    questions: questions
      .filter(question => question.visibility === 'public')
      .map(({ visibility: _visibility, ...question }) => question),
    selectedQas: selectedQas
      .filter(qa => qa.visibility === 'public')
      .map(({ visibility: _visibility, ...qa }) => qa),
  };
}

export const readableLearningRecords = learningRecordFixtures
  .map(toPublicRecord)
  .filter((record): record is PublicLearningRecord => Boolean(record));

export const publicLearningRecords = readableLearningRecords.filter(
  record => record.visibility === 'public'
);

const readableBySlug = new Map(
  readableLearningRecords.map(record => [record.slug, record])
);
const readableById = new Map(
  readableLearningRecords.map(record => [record.id, record])
);

export function getReadableLearningRecord(slug: string) {
  return readableBySlug.get(slug);
}

export function getReadableLearningRecordById(id: string) {
  return readableById.get(id);
}

export function projectSpaceItemToLearningRecord(item: Item): LearningRecord {
  const active = item.versions[item.defaultIndex] ?? item.versions[0];
  const sourceId = `space-item:${item.id}`;
  return {
    schemaVersion: LEARNING_RECORD_SCHEMA_VERSION,
    id: `space:${item.id}`,
    slug: item.slug,
    canonicalUrl: `/space/records/${item.slug}`,
    visibility: item.tags.some(
      tag => tag.toLowerCase() === 'visibility:private'
    )
      ? 'private-owner'
      : 'public',
    title: item.title,
    spark:
      active?.content.split(/\n\n|\n/)[0]?.replace(/^#+\s*/, '') ?? item.title,
    mode: 'read',
    topics: item.tags,
    explanation: active?.content ?? '',
    lessonPlan: item.versions.map((version, index) => ({
      id: `version-${index + 1}`,
      title: version.label,
      prompt: `Read and work through ${version.label}.`,
      state: index === item.defaultIndex ? 'current' : 'optional',
    })),
    questions: [],
    selectedQas: [],
    nextActions: [],
    sources: item.url
      ? [
          {
            id: sourceId,
            title: 'Pinned Space source',
            href: item.url,
            kind: 'first-party',
            note: 'Source URL preserved from the current Space item.',
          },
        ]
      : [],
    revisions: [
      {
        id: `space:${item.id}@${item.updatedAt}`,
        createdAt: new Date(item.updatedAt).toISOString().slice(0, 10),
        summary: 'Projected from the current Space item without rewriting it.',
        sourceIds: item.url ? [sourceId] : [],
      },
    ],
    relations: [],
    provenance: {
      kind: 'space-item-projection',
      sourceItemId: item.id,
      sourceSlug: item.slug,
      sourceUpdatedAt: item.updatedAt,
    },
  };
}

function validateLearningRecords(records: readonly LearningRecord[]) {
  const ids = new Set<string>();
  const slugs = new Set<string>();
  for (const record of records) {
    if (ids.has(record.id))
      throw new Error(`Duplicate learning record id: ${record.id}`);
    if (slugs.has(record.slug))
      throw new Error(`Duplicate learning record slug: ${record.slug}`);
    ids.add(record.id);
    slugs.add(record.slug);
    if (record.canonicalUrl !== `/space/records/${record.slug}`) {
      throw new Error(`Invalid canonical URL for ${record.id}`);
    }
    if (
      new Set(record.revisions.map(item => item.id)).size !==
      record.revisions.length
    ) {
      throw new Error(`Duplicate revision id in ${record.id}`);
    }
    const sourceIds = new Set(record.sources.map(sourceItem => sourceItem.id));
    for (const [index, revisionItem] of record.revisions.entries()) {
      if (revisionItem.id !== `${record.id}@r${index + 1}`) {
        throw new Error(`Unstable revision id in ${record.id}`);
      }
      if (!revisionItem.summary.trim()) {
        throw new Error(`Missing revision summary in ${revisionItem.id}`);
      }
      for (const sourceId of revisionItem.sourceIds) {
        if (!sourceIds.has(sourceId)) {
          throw new Error(
            `Missing revision source ${sourceId} in ${revisionItem.id}`
          );
        }
      }
    }
  }
  for (const record of records) {
    for (const edge of record.relations) {
      if (!ids.has(edge.targetId))
        throw new Error(`Missing relation target: ${edge.targetId}`);
      if (!edge.reason.trim())
        throw new Error(`Missing relation reason in ${record.id}`);
    }
  }
}

validateLearningRecords(learningRecordFixtures);
