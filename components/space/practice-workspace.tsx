'use client';

import { useSearchParams } from 'next/navigation';
import type { ConceptExercise } from '@/lib/concept-practice';
import { CodePracticeBench } from './code-practice-bench';
import { ConceptPracticeBench } from './concept-practice-bench';
import { usePracticeHistory } from './use-practice-history';
import styles from './practice.module.css';

export function PracticeWorkspace({
  concepts,
}: {
  concepts: ConceptExercise[];
}) {
  const params = useSearchParams();
  const mode = params.get('mode') === 'concepts' ? 'concepts' : 'code';
  const history = usePracticeHistory();
  function choose(next: string) {
    const url = new URL(window.location.href);
    url.searchParams.set('mode', next);
    window.history.replaceState(null, '', url.pathname + url.search);
  }
  return (
    <>
      <div
        className="mb-6 flex gap-5 border-b border-border"
        role="group"
        aria-label="Practice material"
      >
        {(['code', 'concepts'] as const).map(item => (
          <button
            key={item}
            onClick={() => choose(item)}
            aria-pressed={mode === item}
            className={`${styles.control} text-sm font-medium`}
          >
            {item === 'code' ? 'Code' : 'Concepts'}
          </button>
        ))}
      </div>
      {mode === 'code' ? (
        <CodePracticeBench />
      ) : (
        <ConceptPracticeBench concepts={concepts} />
      )}
      <details className="mt-8 border-t border-border py-4">
        <summary className="cursor-pointer text-sm font-medium">
          Recent practice
        </summary>
        {history.results.length ? (
          <>
            <ul className="mt-3 divide-y divide-border/60">
              {history.results.slice(0, 8).map(result => (
                <li
                  key={result.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3 text-sm"
                >
                  <span>
                    {result.title}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {result.mode}
                    </span>
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {result.mode === 'concept'
                      ? result.rating === 'revisit'
                        ? 'Revisit'
                        : 'Recalled'
                      : `${Math.round(result.elapsed / 1000)}s · ${result.mistakes} corrected${result.assisted ? ' · assisted' : result.wpm === null ? '' : ` · ${result.wpm} WPM`}`}
                    <time dateTime={result.date} className="ml-3">
                      {new Date(result.date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </time>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>
                {history.sessionOnly
                  ? 'This session only · browser storage unavailable'
                  : 'Saved on this browser · last 50 attempts'}
              </span>
              <button
                onClick={history.clear}
                className="min-h-[44px] px-2 underline underline-offset-4"
              >
                Clear history
              </button>
            </div>
          </>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Complete a function or check a concept to start your history.
          </p>
        )}
      </details>
    </>
  );
}
