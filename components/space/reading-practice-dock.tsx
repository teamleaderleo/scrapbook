'use client';

import {
  useCallback,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import {
  buildSpacePracticePrompt,
  compareSpaceTyping,
  SPACE_PRACTICE_MODES,
  spacePracticeStorageKey,
  spaceTypingWpm,
  type SpacePracticeMode,
  type SpaceTypingTarget,
} from '@/lib/space-practice';

const DRAFT_EVENT = 'space-practice-draft';
const memoryDrafts = new Map<string, string>();

function useLocalPracticeDraft(key: string) {
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
        // The in-memory draft remains usable when storage is unavailable.
      }
      window.dispatchEvent(new CustomEvent(DRAFT_EVENT, { detail: key }));
    },
    [key]
  );

  return [draft, setDraft] as const;
}

function TypingReference({
  target,
  typed,
}: {
  target: SpaceTypingTarget;
  typed: string;
}) {
  return (
    <div className="border-y border-[hsl(var(--material-paper-edge)/0.55)] bg-[hsl(var(--material-paper-ink)/0.025)] px-4 py-4 sm:px-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[hsl(var(--material-paper-ink)/0.48)]">
        <span>{target.label}</span>
        <span>{target.kind === 'code' ? 'Exact code' : 'Exact wording'}</span>
      </div>
      <p className="sr-only">Typing reference: {target.text}</p>
      <pre
        aria-hidden="true"
        className="max-h-72 overflow-auto whitespace-pre-wrap break-words font-mono text-[13px] leading-6 sm:text-sm"
      >
        {Array.from(target.text).map((character, index) => {
          const typedCharacter = typed[index];
          const current = index === typed.length;
          const className =
            typedCharacter === undefined
              ? current
                ? 'rounded-sm bg-[hsl(var(--material-paper-ink)/0.1)] text-[hsl(var(--material-paper-ink))]'
                : 'text-[hsl(var(--material-paper-ink)/0.42)]'
              : typedCharacter === character
                ? 'text-[hsl(var(--material-paper-ink))]'
                : 'rounded-sm bg-destructive/10 text-destructive underline decoration-destructive/40 decoration-2 underline-offset-2';

          return (
            <span key={`${index}-${character}`} className={className}>
              {character}
            </span>
          );
        })}
      </pre>
    </div>
  );
}

export function ReadingPracticeDock({
  slug,
  title,
  sourceUrl,
  initialMode = 'question',
  promptOverride,
  typingTarget,
}: {
  slug: string;
  title: string;
  sourceUrl?: string | null;
  initialMode?: SpacePracticeMode;
  promptOverride?: string;
  typingTarget?: SpaceTypingTarget | null;
}) {
  const [mode, setMode] = useState<SpacePracticeMode>(initialMode);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>(
    'idle'
  );
  const typingStartedAtRef = useRef<number | null>(null);
  const [typingElapsedMs, setTypingElapsedMs] = useState(0);
  const storageKey = spacePracticeStorageKey(slug, mode);
  const [draft, setDraft] = useLocalPracticeDraft(storageKey);
  const practiceModes = typingTarget
    ? SPACE_PRACTICE_MODES
    : SPACE_PRACTICE_MODES.filter(item => item.id !== 'type');
  const modeDefinition =
    practiceModes.find(item => item.id === mode) ?? practiceModes[0];
  const activeMode = modeDefinition.id;
  const activePrompt =
    activeMode === initialMode && promptOverride?.trim()
      ? promptOverride
      : modeDefinition.prompt;
  const typingStats =
    activeMode === 'type' && typingTarget
      ? compareSpaceTyping(typingTarget.text, draft)
      : null;
  const typingWpm = typingStats
    ? spaceTypingWpm(typingStats.correctCharacters, typingElapsedMs)
    : 0;

  const chooseMode = (nextMode: SpacePracticeMode) => {
    setMode(nextMode);
    setCopyState('idle');
    typingStartedAtRef.current = null;
    setTypingElapsedMs(0);
  };

  const updateDraft = (value: string) => {
    if (activeMode === 'type') {
      const now = Date.now();
      if (typingStartedAtRef.current === null) typingStartedAtRef.current = now;
      setTypingElapsedMs(now - typingStartedAtRef.current);
    }
    setDraft(value);
    setCopyState('idle');
  };

  const clearDraft = () => {
    setDraft('');
    setCopyState('idle');
    typingStartedAtRef.current = null;
    setTypingElapsedMs(0);
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(
        buildSpacePracticePrompt({
          mode: activeMode,
          title,
          sourceUrl,
          draft,
          prompt: activePrompt,
          typingTarget,
        })
      );
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  };

  return (
    <section
      aria-labelledby="practice-bench-title"
      className="border-t border-dashed border-[hsl(var(--material-paper-edge)/0.65)] px-4 py-6 sm:px-9 sm:py-9"
      data-reading-practice
    >
      <header className="mx-auto max-w-[68ch]">
        <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--material-paper-ink)/0.5)]">
          Practice bench
        </p>
        <h2
          id="practice-bench-title"
          className="mt-2 text-xl font-semibold tracking-[-0.025em] sm:text-2xl"
        >
          Work the material
        </h2>
        <p className="mt-2 text-sm leading-6 text-[hsl(var(--material-paper-ink)/0.64)]">
          Question it, explain it, trace it, review it, alter it, or build typing
          fluency. Drafts stay on this device.
        </p>
      </header>

      <div className="mx-auto mt-5 max-w-[68ch] overflow-hidden rounded-[1.35rem] border border-[hsl(var(--material-paper-edge)/0.7)] bg-[hsl(var(--material-paper-face)/0.48)] shadow-[0_10px_30px_rgba(39,34,28,0.08)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.22)]">
        <div className="px-4 pb-3 pt-4 sm:px-5 sm:pt-5">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[hsl(var(--material-paper-ink)/0.08)] font-mono text-[9px] font-semibold uppercase tracking-[0.08em]">
              You
            </span>
            <p className="text-sm font-medium leading-6">{activePrompt}</p>
          </div>
        </div>

        {activeMode === 'type' && typingTarget ? (
          <TypingReference target={typingTarget} typed={draft} />
        ) : null}

        <textarea
          value={draft}
          onChange={event => updateDraft(event.target.value)}
          aria-label={
            activeMode === 'type'
              ? 'Typing input'
              : `${modeDefinition.label} notes`
          }
          placeholder={
            activeMode === 'type'
              ? 'Start typing the excerpt…'
              : 'Write a thought, a rough answer, or the next question…'
          }
          rows={activeMode === 'type' ? 7 : 5}
          spellCheck={activeMode === 'type' ? false : undefined}
          autoCapitalize={activeMode === 'type' ? 'off' : undefined}
          autoCorrect={activeMode === 'type' ? 'off' : undefined}
          autoComplete={activeMode === 'type' ? 'off' : undefined}
          className={`block w-full resize-y bg-transparent px-4 py-3 text-[15px] leading-7 text-[hsl(var(--material-paper-ink))] outline-none placeholder:text-[hsl(var(--material-paper-ink)/0.38)] focus-visible:bg-white/20 dark:focus-visible:bg-black/10 sm:px-5 ${
            activeMode === 'type' ? 'min-h-44 font-mono text-sm' : 'min-h-36'
          }`}
        />

        {typingStats && typingTarget ? (
          <div
            className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[hsl(var(--material-paper-edge)/0.45)] px-4 py-2.5 font-mono text-[10px] tabular-nums text-[hsl(var(--material-paper-ink)/0.58)] sm:px-5"
            aria-live="polite"
          >
            <span>
              {Math.min(draft.length, typingTarget.text.length)} /{' '}
              {typingTarget.text.length} chars
            </span>
            <span>
              {draft.length
                ? `${Math.round(typingStats.accuracy * 100)}% exact`
                : 'Exactness first'}
            </span>
            <span>{typingStats.errorCharacters} errors</span>
            {typingWpm > 0 ? <span>{typingWpm} wpm</span> : null}
            {typingStats.complete ? (
              <strong className="font-semibold text-[hsl(var(--material-paper-ink))]">
                Exact pass
              </strong>
            ) : null}
          </div>
        ) : null}

        <footer className="flex flex-col gap-3 border-t border-[hsl(var(--material-paper-edge)/0.55)] bg-[hsl(var(--material-paper-ink)/0.025)] px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div
            className="grid grid-cols-3 gap-1 rounded-xl bg-[hsl(var(--material-paper-ink)/0.045)] p-1"
            role="group"
            aria-label="Practice mode"
          >
            {practiceModes.map(item => {
              const active = item.id === activeMode;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => chooseMode(item.id)}
                  className={`h-11 rounded-lg px-3 text-xs font-medium transition-[background-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--material-paper-ink)/0.35)] ${
                    active
                      ? 'bg-[hsl(var(--material-paper-face))] text-[hsl(var(--material-paper-ink))] shadow-sm'
                      : 'text-[hsl(var(--material-paper-ink)/0.58)] hover:text-[hsl(var(--material-paper-ink))]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-2">
            {draft ? (
              <button
                type="button"
                onClick={clearDraft}
                className="h-11 rounded-lg px-3 text-xs font-medium text-[hsl(var(--material-paper-ink)/0.58)] hover:bg-[hsl(var(--material-paper-ink)/0.05)] hover:text-[hsl(var(--material-paper-ink))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--material-paper-ink)/0.35)]"
              >
                {activeMode === 'type' ? 'Restart' : 'Clear'}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => void copyPrompt()}
              className="h-11 rounded-xl border border-[hsl(var(--material-paper-edge)/0.8)] bg-[hsl(var(--material-paper-ink))] px-4 text-xs font-semibold text-[hsl(var(--material-paper-face))] transition-[transform,box-shadow] hover:-translate-y-px hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--material-paper-ink)/0.35)]"
            >
              {copyState === 'copied'
                ? 'Copied'
                : activeMode === 'type'
                  ? 'Copy exercise'
                  : 'Copy prompt'}
            </button>
          </div>
        </footer>
      </div>

      <p
        className="mx-auto mt-2 max-w-[68ch] px-1 font-mono text-[9px] uppercase tracking-[0.1em] text-[hsl(var(--material-paper-ink)/0.42)]"
        aria-live="polite"
      >
        {copyState === 'failed'
          ? 'Clipboard unavailable · select the text manually'
          : activeMode === 'type'
            ? 'Exactness first · WPM is secondary · copy saved on this device'
            : 'Saved on this device · one draft per mode'}
      </p>
    </section>
  );
}
