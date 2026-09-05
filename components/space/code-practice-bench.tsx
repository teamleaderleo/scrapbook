'use client';

import { useId, useState } from 'react';
import styles from './practice.module.css';
import { practicePassages } from '@/lib/practice-passages';
import { TypingExercise } from './typing-exercise';
import { usePracticeHistory } from './use-practice-history';
import { useLocalPracticeDraft } from './reading-practice-dock';
import { practiceInsights } from '@/lib/practice-insights';
import { PracticeLineNotes } from './practice-line-notes';

export function CodePracticeBench() {
  const [selected, setSelected] = useState(0);
  const [recall, setRecall] = useState(false);
  const exercise = practicePassages[selected];
  const [showLineNotes, setShowLineNotes] = useState(false);
  const [lineSelection, setLineSelection] = useState({ slug: '', index: 0 });
  const lineNotesId = useId();
  const insights = practiceInsights[exercise.slug] ?? [];
  const selectedLine = lineSelection.slug === exercise.slug ? lineSelection.index : 0;
  const lineNotesOpen = showLineNotes && !recall && insights.length > 0;
  const highlightedLine = lineNotesOpen
    ? exercise.text.split('\n').indexOf(insights[selectedLine].match) + 1
    : undefined;
  const history = usePracticeHistory();
  const historySlug = `${exercise.slug}:${exercise.revision}`;
  const mode = recall ? 'recall' : 'copy';
  const comparable = history.results.filter(
    result =>
      result.slug === historySlug &&
      result.mode === mode &&
      !result.assisted &&
      result.wpm !== null
  );
  const best = comparable.length
    ? Math.max(...comparable.map(result => result.wpm!))
    : null;
  const [notes, setNotes] = useLocalPracticeDraft(
    `scrapbook:code-notes:${historySlug}`
  );
  return (
    <div className="min-w-0">
      <div
        className="mb-3 flex flex-wrap gap-x-5"
        role="group"
        aria-label="Passage collection"
      >
        {(['Scrapbook', 'Patterns', 'Ideas'] as const).map(collection => (
          <button
            key={collection}
            aria-pressed={exercise.collection === collection}
            onClick={() => setSelected(practicePassages.findIndex(
              item => item.collection === collection
            ))}
            className={`${styles.control} text-sm`}
          >
            {collection}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="flex flex-wrap items-center gap-x-5 gap-y-1"
          role="group"
          aria-label="Passage"
        >
          {practicePassages.map((item, index) => item.collection === exercise.collection ? (
            <button
              key={item.slug}
              aria-pressed={selected === index}
              onClick={() => setSelected(index)}
              className={`${styles.control} text-sm`}
            >
              {item.title}
            </button>
          ) : null)}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            className="inline-flex gap-4 text-sm"
            role="group"
            aria-label="Typing mode"
          >
            <button
              aria-pressed={!recall}
              onClick={() => setRecall(false)}
              className={styles.control}
            >
              Copy
            </button>
            <button
              aria-pressed={recall}
              onClick={() => setRecall(true)}
              className={styles.control}
            >
              Recall
            </button>
          </div>
          {!recall && insights.length > 0 ? (
            <button
              className={`${styles.control} text-sm`}
              aria-expanded={lineNotesOpen}
              aria-controls={lineNotesOpen ? lineNotesId : undefined}
              onClick={() => setShowLineNotes(open => !open)}
            >
              Line notes
            </button>
          ) : null}
          {best !== null ? (
            <span className="font-mono text-xs text-muted-foreground">
              {mode} best {best} WPM · last {comparable[0].wpm} WPM
            </span>
          ) : null}
        </div>
      </div>
      <div className={lineNotesOpen ? 'mt-2 grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]' : 'mt-2'}>
        <TypingExercise
          key={`${exercise.slug}:${mode}`}
          target={{ kind: exercise.kind, label: exercise.title, text: exercise.text }}
          recall={recall}
          highlightedLine={highlightedLine}
          onComplete={result =>
            history.add({
              ...result,
              id: crypto.randomUUID(),
              slug: historySlug,
              title: exercise.title,
              mode,
              date: new Date().toISOString(),
            })
          }
        />
        {lineNotesOpen ? (
          <PracticeLineNotes
            key={exercise.slug}
            id={lineNotesId}
            text={exercise.text}
            insights={insights}
            selected={selectedLine}
            onSelect={index => setLineSelection({ slug: exercise.slug, index })}
          />
        ) : null}
      </div>
      <details className="mt-5 border-t border-border py-3">
        <summary className="cursor-pointer text-sm font-medium">
          Think it through
        </summary>
        <p className="mt-3 text-sm leading-6">{exercise.question}</p>
        <p className="mt-3 text-sm leading-6">{exercise.alter}</p>
        <textarea
          aria-label="Passage notes"
          value={notes}
          onChange={event => setNotes(event.target.value)}
          placeholder="Explain it, or sketch the change…"
          className="mt-3 min-h-[128px] w-full border-b border-border bg-transparent py-3 font-mono text-base leading-6 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Notes saved on this device.
        </p>
      </details>
      <details className="border-t border-border py-3 text-xs text-muted-foreground">
        <summary className="cursor-pointer">Source</summary>
        <p className="mt-3 leading-6">
          {exercise.line !== undefined ? <>
          <a
            className="underline underline-offset-4"
            href={`https://github.com/teamleaderleo/scrapbook/blob/${exercise.revision}/lib/space-practice.ts#L${exercise.line}`}
            target="_blank"
            rel="noreferrer"
          >
            Scrapbook · lib/space-practice.ts · {exercise.revision.slice(0, 7)}
          </a>
          <br />
          Owner-authorized excerpts. No repository license declared.
          </> : <>Original practice passage · {exercise.revision}</>}
        </p>
      </details>
    </div>
  );
}
