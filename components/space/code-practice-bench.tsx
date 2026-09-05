'use client';

import { useState } from 'react';
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
        <label className="flex flex-wrap items-center gap-3 text-sm">
          Function
          <select
            aria-label="Function"
            value={selected}
            onChange={event => setSelected(Number(event.target.value))}
            className="min-h-[44px] max-w-full rounded-md border border-border bg-background px-3"
          >
            {codeExercises.map((item, index) => (
              <option key={item.slug} value={index}>
                {item.title} · TypeScript
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            className="inline-flex rounded-md border border-border p-1"
            role="group"
            aria-label="Code mode"
          >
            <button
              aria-pressed={!recall}
              onClick={() => setRecall(false)}
              className={`min-h-[44px] rounded px-4 text-sm ${!recall ? 'bg-foreground text-background' : 'text-muted-foreground'}`}
            >
              Copy
            </button>
            <button
              aria-pressed={recall}
              onClick={() => setRecall(true)}
              className={`min-h-[44px] rounded px-4 text-sm ${recall ? 'bg-foreground text-background' : 'text-muted-foreground'}`}
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
      <div className="mt-5 overflow-hidden rounded-xl border border-border bg-card">
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
          className="mt-3 min-h-[128px] w-full rounded-md border border-border bg-background p-3 font-mono text-base leading-6 focus-visible:ring-2 focus-visible:ring-ring"
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
