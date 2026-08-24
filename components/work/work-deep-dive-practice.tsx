'use client';

import { useCallback, useState, useSyncExternalStore } from 'react';

const DRAFT_EVENT = 'work-deep-dive-draft';
const memoryDrafts = new Map<string, string>();

const BASE_PROMPTS = [
  {
    id: 'overview',
    label: '60 sec',
    title: 'Give the short version',
    prompt:
      'State the problem, the hard constraint, what you personally owned, and the result. Stop after the useful headline.',
  },
  {
    id: 'decision',
    label: 'Decision',
    title: 'Defend one technical decision',
    prompt:
      'Pick one consequential technical choice. What alternatives did you consider, what tradeoff decided it, and what evidence would have made you choose differently?',
  },
  {
    id: 'evidence',
    label: 'Evidence',
    title: 'Prove the claim',
    prompt:
      'Name the measurement, test, review, or production signal that changed your confidence. Explain why it discriminated between competing explanations.',
  },
  {
    id: 'reversal',
    label: 'Reversal',
    title: 'Tell the wrong-turn story',
    prompt:
      'Describe a plausible approach that turned out to be aimed at the wrong owner or assumption. What exposed the mistake, and how did the repair move?',
  },
  {
    id: 'ownership',
    label: 'Ownership',
    title: 'Make the collaboration boundary legible',
    prompt:
      'Where did another person, reviewer, maintainer, or user materially change the work? What judgment remained yours, and how did the collaboration improve the outcome?',
  },
  {
    id: 'again',
    label: 'Again',
    title: 'Redesign it with hindsight',
    prompt:
      'If you started again today, what would you keep, what would you change first, and which uncertainty would you test earlier?',
  },
] as const;

export type WorkDeepDivePromptId = (typeof BASE_PROMPTS)[number]['id'];

export function buildWorkDeepDivePrompt(
  promptId: WorkDeepDivePromptId,
  reversal?: string
) {
  const definition =
    BASE_PROMPTS.find(prompt => prompt.id === promptId) ?? BASE_PROMPTS[0];

  if (promptId === 'reversal' && reversal) {
    return {
      ...definition,
      prompt: `Use the real reversal in the record as your starting point: ${reversal} Then explain what evidence moved the repair boundary and what you learned.`,
    };
  }

  return definition;
}

function draftKey(recordId: string, promptId: WorkDeepDivePromptId) {
  return `work:deep-dive:${recordId}:${promptId}`;
}

function useLocalDraft(key: string) {
  const subscribe = useCallback(
    (listener: () => void) => {
      const onChange = (event: Event) => {
        if (event instanceof StorageEvent && event.key !== key) return;
        if (event instanceof CustomEvent && event.detail !== key) return;
        listener();
      };

      window.addEventListener('storage', onChange);
      window.addEventListener(DRAFT_EVENT, onChange);
      return () => {
        window.removeEventListener('storage', onChange);
        window.removeEventListener(DRAFT_EVENT, onChange);
      };
    },
    [key]
  );
  const getSnapshot = useCallback(() => {
    try {
      return window.localStorage.getItem(key) ?? memoryDrafts.get(key) ?? '';
    } catch {
      return memoryDrafts.get(key) ?? '';
    }
  }, [key]);
  const draft = useSyncExternalStore(subscribe, getSnapshot, () => '');
  const setDraft = useCallback(
    (value: string) => {
      if (value) memoryDrafts.set(key, value);
      else memoryDrafts.delete(key);

      try {
        if (value) window.localStorage.setItem(key, value);
        else window.localStorage.removeItem(key);
      } catch {
        // The in-memory note remains useful when localStorage is unavailable.
      }

      window.dispatchEvent(new CustomEvent(DRAFT_EVENT, { detail: key }));
    },
    [key]
  );

  return [draft, setDraft] as const;
}

export function WorkDeepDivePractice({
  recordId,
  title,
  reversal,
}: {
  recordId: string;
  title: string;
  reversal?: string;
}) {
  const [promptId, setPromptId] = useState<WorkDeepDivePromptId>('overview');
  const activePrompt = buildWorkDeepDivePrompt(promptId, reversal);
  const storageKey = draftKey(recordId, promptId);
  const [draft, setDraft] = useLocalDraft(storageKey);

  return (
    <details
      className="group mt-7 border-y border-border"
      data-work-deep-dive={recordId}
    >
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Interview rehearsal
          </span>
          <span className="mt-1 block text-sm font-semibold text-foreground/80">
            Project deep dive · {title}
          </span>
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground group-open:hidden">
          Open
        </span>
        <span className="hidden font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground group-open:inline">
          Close
        </span>
      </summary>

      <div className="border-t border-border pb-5 pt-4">
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          Say the answer out loud first. Then write only the missing fact,
          sharper phrasing, or follow-up you want to revisit. Notes stay on this
          device.
        </p>

        <div
          className="mt-4 grid grid-cols-3 gap-1 sm:grid-cols-6"
          role="group"
          aria-label={`${title} deep-dive prompt`}
        >
          {BASE_PROMPTS.map(candidate => {
            const active = candidate.id === promptId;
            return (
              <button
                key={candidate.id}
                type="button"
                aria-pressed={active}
                onClick={() => setPromptId(candidate.id)}
                className={`min-h-10 rounded-md border px-2 py-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.09em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  active
                    ? 'border-foreground/30 bg-foreground text-background'
                    : 'border-border bg-background text-muted-foreground hover:border-foreground/25 hover:text-foreground'
                }`}
              >
                {candidate.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.72fr)]">
          <div className="border-l-2 border-foreground/25 pl-4">
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {activePrompt.title}
            </p>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-foreground/82">
              {activePrompt.prompt}
            </p>
          </div>

          <div>
            <label
              htmlFor={`work-deep-dive-${recordId}-${promptId}`}
              className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
            >
              Debrief note
            </label>
            <textarea
              id={`work-deep-dive-${recordId}-${promptId}`}
              value={draft}
              onChange={event => setDraft(event.target.value)}
              rows={4}
              placeholder="What did you omit, over-explain, or need to verify?"
              className="mt-2 block min-h-28 w-full resize-y rounded-lg border border-border bg-card/55 px-3 py-2.5 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="mt-2 flex min-h-8 items-center justify-between gap-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                one local note per prompt
              </span>
              {draft ? (
                <button
                  type="button"
                  onClick={() => setDraft('')}
                  className="min-h-8 rounded-md px-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </details>
  );
}
