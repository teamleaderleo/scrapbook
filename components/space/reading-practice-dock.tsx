'use client';

import { useCallback, useState, useSyncExternalStore } from 'react';
import {
  buildSpacePracticePrompt,
  SPACE_PRACTICE_MODES,
  spacePracticeStorageKey,
  type SpacePracticeMode,
  type SpaceTypingTarget,
} from '@/lib/space-practice';

import { TypingExercise } from './typing-exercise';
import styles from './practice.module.css';

const DRAFT_EVENT = 'space-practice-draft';
const memoryDrafts = new Map<string, string>();

export function useLocalPracticeDraft(key: string) {
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
  const chooseMode = (nextMode: SpacePracticeMode) => {
    setMode(nextMode);
    setCopyState('idle');
  };

  const updateDraft = (value: string) => {
    setDraft(value);
    setCopyState('idle');
  };

  const clearDraft = () => {
    setDraft('');
    setCopyState('idle');
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(
        buildSpacePracticePrompt({
          mode: activeMode,
          title,
          sourceUrl,
          draft: activeMode === 'type' ? '' : draft,
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
          Drafts stay on this device.
        </p>
      </header>

      <div className="mx-auto mt-5 max-w-[68ch]">
        <p className="py-3 text-sm leading-6 text-muted-foreground">
          {activePrompt}
        </p>

        {activeMode === 'type' && typingTarget ? (
          <TypingExercise
            key={`${slug}:${typingTarget.text}`}
            target={typingTarget}
          />
        ) : (
          <textarea
            value={draft}
            onChange={event => updateDraft(event.target.value)}
            aria-label={`${modeDefinition.label} notes`}
            placeholder="Write a thought, a rough answer, or the next question…"
            rows={5}
            className="block min-h-36 w-full resize-y bg-transparent px-4 py-3 text-base leading-7 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-5"
          />
        )}

        <footer className="flex flex-col gap-3 border-t border-border/60 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div
            className="flex flex-wrap gap-x-4 gap-y-1"
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
                  className={`${styles.control} text-xs`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-2">
            {draft && activeMode !== 'type' ? (
              <button
                type="button"
                onClick={clearDraft}
                className="h-11 rounded-lg px-3 text-xs font-medium text-[hsl(var(--material-paper-ink)/0.58)] hover:bg-[hsl(var(--material-paper-ink)/0.05)] hover:text-[hsl(var(--material-paper-ink))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--material-paper-ink)/0.35)]"
              >
                Clear
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
            ? ''
            : 'Saved on this device · one draft per mode'}
      </p>
    </section>
  );
}
