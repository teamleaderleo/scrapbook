'use client';

import { useState } from 'react';
import { codeExercises, practiceRevision } from '@/lib/code-practice';
import { TypingExercise } from './typing-exercise';

export function CodePracticeBench() {
  const [selected, setSelected] = useState(0);
  const exercise = codeExercises[selected];
  return (
    <div className="min-w-0">
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
      <div className="mt-5 overflow-hidden rounded-xl border border-border bg-card">
        <TypingExercise
          key={exercise.slug}
          target={{ kind: 'code', label: exercise.title, text: exercise.text }}
        />
      </div>
      <details className="mt-5 border-t border-border py-3">
        <summary className="cursor-pointer text-sm font-medium">
          Think it through
        </summary>
        <p className="mt-3 text-sm leading-6">{exercise.question}</p>
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
