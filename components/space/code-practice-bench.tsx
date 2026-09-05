'use client';

import { useState } from 'react';
import styles from './practice.module.css';
import { codeExercises, practiceRevision } from '@/lib/code-practice';
import { TypingExercise } from './typing-exercise';
import { usePracticeHistory } from './use-practice-history';
import { useLocalPracticeDraft } from './reading-practice-dock';

export function CodePracticeBench() {
  const [selected, setSelected] = useState(0);
  const [recall, setRecall] = useState(false);
  const exercise = codeExercises[selected];
  const history = usePracticeHistory();
  const historySlug = `${exercise.slug}:${practiceRevision}`;
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="flex flex-wrap items-center gap-x-5 gap-y-1"
          role="group"
          aria-label="Function"
        >
          {codeExercises.map((item, index) => (
            <button
              key={item.slug}
              aria-pressed={selected === index}
              onClick={() => setSelected(index)}
              className={`${styles.control} text-sm`}
            >
              {item.title}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            className="inline-flex gap-4 text-sm"
            role="group"
            aria-label="Code mode"
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
          {best !== null ? (
            <span className="font-mono text-xs text-muted-foreground">
              {mode} best {best} WPM · last {comparable[0].wpm} WPM
            </span>
          ) : null}
        </div>
      </div>
      <div className="mt-2">
        <TypingExercise
          key={`${exercise.slug}:${mode}`}
          target={{ kind: 'code', label: exercise.title, text: exercise.text }}
          recall={recall}
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
      </div>
      <details className="mt-5 border-t border-border py-3">
        <summary className="cursor-pointer text-sm font-medium">
          Think it through
        </summary>
        <p className="mt-3 text-sm leading-6">{exercise.question}</p>
        <p className="mt-3 text-sm leading-6">{exercise.alter}</p>
        <textarea
          aria-label="Code explanation or changes"
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
          <a
            className="underline underline-offset-4"
            href={`https://github.com/teamleaderleo/scrapbook/blob/${practiceRevision}/lib/space-practice.ts#L${exercise.line}`}
            target="_blank"
            rel="noreferrer"
          >
            Scrapbook · lib/space-practice.ts · {practiceRevision.slice(0, 7)}
          </a>
          <br />
          Owner-authorized excerpts. No repository license declared.
        </p>
      </details>
    </div>
  );
}
