'use client';

import { useState } from 'react';
import type { PracticeInsight } from '@/lib/practice-insights';
import styles from './practice.module.css';

export function PracticeLineNotes({
  id, text, insights, selected, onSelect,
}: {
  id: string;
  text: string;
  insights: PracticeInsight[];
  selected: number;
  onSelect: (index: number) => void;
}) {
  const insight = insights[selected];
  return (
    <aside id={id} aria-label="Line notes" className="min-w-0 border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-5">
      <div role="group" aria-label="Annotated lines" className="flex flex-wrap gap-x-4">
        {insights.map((item, index) => (
          <button
            key={item.match}
            className={`${styles.control} text-sm`}
            aria-pressed={selected === index}
            onClick={() => onSelect(index)}
          >
            L{text.split('\n').indexOf(item.match) + 1} · {item.title}
          </button>
        ))}
      </div>
      <p className="my-3 text-sm leading-6">{insight.note}</p>
      <LineComparison key={insight.match} insight={insight} />
    </aside>
  );
}

function LineComparison({ insight }: { insight: PracticeInsight }) {
  const [selected, setSelected] = useState(-1);
  const change = selected < 0 ? null : insight.changes[selected];
  const cases = (change ?? insight.changes[0]).cases;
  return (
    <>
      <div role="group" aria-label="Example edits" className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <button className={styles.control} aria-pressed={!change} onClick={() => setSelected(-1)}>
          Original
        </button>
        {insight.changes.map((item, index) => (
          <button key={item.label} className={styles.control} aria-pressed={selected === index} onClick={() => setSelected(index)}>
            {item.label}
          </button>
        ))}
      </div>
      <div role="region" aria-label="Example results" aria-live="polite" className="mt-3 text-sm">
        <div className="space-y-2 border-y border-border py-3 font-mono text-xs leading-5">
          <div>
            <span className="sr-only">Original line: </span>
            <code className="whitespace-pre-wrap break-words">{insight.match.trim()}</code>
          </div>
          {change ? (
            <div className="border-l-2 border-current pl-2 text-[var(--practice-leaf)]">
              <span className="text-xs">{change.replacement ? 'Becomes' : 'Removed'}</span>
              {change.replacement ? <code className="mt-1 block whitespace-pre-wrap break-words">{change.replacement.trim()}</code> : null}
            </div>
          ) : null}
        </div>
        {change ? <p className="mt-3 leading-6">{change.consequence}</p> : null}
        <ul className="mt-4 space-y-4">
          {cases.map(item => (
            <li key={item.input}>
              <p className="text-xs leading-5 text-muted-foreground">{item.input}</p>
              <dl className="mt-1 grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-xs text-muted-foreground">Original</dt>
                  <dd className="mt-1 break-all font-mono text-sm">{item.original}</dd>
                </div>
                {change ? <div>
                  <dt className="text-xs text-muted-foreground">Changed</dt>
                  <dd className="mt-1 break-all font-mono text-sm">{item.changed}</dd>
                </div> : null}
              </dl>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Precomputed examples</p>
    </>
  );
}
