'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { ConceptExercise } from '@/lib/concept-practice';
import { useLocalPracticeDraft } from './reading-practice-dock';
import { usePracticeHistory } from './use-practice-history';

function ConceptQuestion({
  concept,
  question,
}: {
  concept: ConceptExercise;
  question: number;
}) {
  const [revealed, setRevealed] = useState(false);
  const [rated, setRated] = useState('');
  const [notes, setNotes] = useLocalPracticeDraft(
    `scrapbook:concept-notes:${concept.slug}:${question}`
  );
  const history = usePracticeHistory();
  const record = (rating: 'revisit' | 'recalled') => {
    history.add({
      id: crypto.randomUUID(),
      slug: concept.slug,
      title: concept.title,
      date: new Date().toISOString(),
      mode: 'concept',
      elapsed: 0,
      wpm: null,
      mistakes: 0,
      assisted: false,
      rating,
    });
    setRated(rating);
  };
  return (
    <article className="mt-5 overflow-hidden rounded-xl border border-border bg-card">
      <div className="px-5 py-6 sm:px-6">
        <p className="font-mono text-xs text-muted-foreground">
          {concept.topic.replaceAll('-', ' ')}
        </p>
        <h2 className="mt-2 font-serif text-2xl">{concept.title}</h2>
        <p className="mt-5 text-base leading-7">
          {concept.questions[question]}
        </p>
        <details className="mt-5">
          <summary className="cursor-pointer py-2 text-sm text-muted-foreground">
            Notes
          </summary>
          <textarea
            aria-label="Concept notes"
            value={notes}
            onChange={event => setNotes(event.target.value)}
            placeholder="Explain it in your own words…"
            className="mt-2 min-h-[128px] w-full rounded-md border border-border bg-background p-3 text-base leading-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Saved on this device.
          </p>
        </details>
      </div>
      {revealed ? (
        <div className="border-t border-border bg-muted/20 px-5 py-5 sm:px-6">
          <h3 className="text-sm font-semibold">Compare with the concept</h3>
          <div className="mt-3 space-y-3 text-sm leading-7 text-muted-foreground">
            {concept.reference.split(/\n\s*\n/).map((paragraph, index) => {
              const lines = paragraph.split('\n');
              return lines.every(line => /^-\s+/.test(line)) ? (
                <ul key={index} className="list-disc space-y-1 pl-5">
                  {lines.map((line, item) => (
                    <li key={item}>{line.replace(/^-\s+/, '')}</li>
                  ))}
                </ul>
              ) : (
                <p key={index}>{paragraph}</p>
              );
            })}
          </div>
          <Link
            href={`/knowledge/${concept.slug}`}
            className="mt-3 inline-flex min-h-[44px] items-center text-sm underline underline-offset-4"
          >
            Read the full concept →
          </Link>
          <div
            className="mt-3 flex flex-wrap items-center gap-2"
            role="group"
            aria-label="Self-check"
          >
            <button
              disabled={!!rated}
              onClick={() => record('revisit')}
              className="min-h-[44px] rounded-md border border-border px-4 text-sm hover:bg-muted disabled:opacity-50"
            >
              Revisit
            </button>
            <button
              disabled={!!rated}
              onClick={() => record('recalled')}
              className="min-h-[44px] rounded-md bg-foreground px-4 text-sm text-background disabled:opacity-50"
            >
              Recalled
            </button>
            <span role="status" className="text-xs text-muted-foreground">
              {rated
                ? rated === 'revisit'
                  ? 'Marked for revisit'
                  : 'Self-check saved'
                : 'Your assessment'}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3 sm:px-6">
          <button
            onClick={() => setRevealed(true)}
            className="min-h-[44px] rounded-md bg-foreground px-4 text-sm text-background"
          >
            Reveal reference
          </button>
          <Link
            href={`/knowledge/${concept.slug}`}
            className="inline-flex min-h-[44px] items-center text-sm text-muted-foreground underline underline-offset-4"
          >
            Read first →
          </Link>
        </div>
      )}
    </article>
  );
}

export function ConceptPracticeBench({
  concepts,
}: {
  concepts: ConceptExercise[];
}) {
  const [query, setQuery] = useState('');
  const params = useSearchParams();
  const selected = params.get('concept') ?? '';
  const setSelected = (slug: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('concept', slug);
    window.history.replaceState(null, '', url.pathname + url.search);
  };
  const [question, setQuestion] = useState(0);
  const [revisit, setRevisit] = useState(false);
  const { results } = usePracticeHistory();
  const latest = new Map<string, string>();
  results
    .filter(result => result.mode === 'concept')
    .forEach(result => {
      if (!latest.has(result.slug))
        latest.set(result.slug, result.rating ?? '');
    });
  const filtered = concepts.filter(
    concept =>
      `${concept.title} ${concept.topic}`
        .toLowerCase()
        .includes(query.toLowerCase().trim()) &&
      (!revisit || latest.get(concept.slug) === 'revisit')
  );
  const concept = filtered.find(item => item.slug === selected) ?? filtered[0];
  const current = concept
    ? Math.min(question, concept.questions.length - 1)
    : 0;
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          aria-label="Find a concept"
          placeholder="Find a concept…"
          value={query}
          onChange={event => {
            setQuery(event.target.value);
            setQuestion(0);
          }}
          className="min-h-[44px] min-w-0 rounded-md border border-border bg-background px-3 text-base sm:text-sm"
        />
        <select
          aria-label="Concept"
          value={concept?.slug ?? ''}
          onChange={event => {
            setSelected(event.target.value);
            setQuestion(0);
          }}
          className="min-h-[44px] min-w-0 max-w-full rounded-md border border-border bg-background px-3 text-sm"
        >
          {filtered.length ? (
            filtered.map(item => (
              <option key={item.slug} value={item.slug}>
                {item.title}
              </option>
            ))
          ) : (
            <option value="">No matching concepts</option>
          )}
        </select>
      </div>
      <label className="mt-2 flex min-h-[44px] items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={revisit}
          onChange={event => {
            setRevisit(event.target.checked);
            setQuestion(0);
          }}
        />
        Marked for revisit
      </label>
      {concept ? (
        <>
          <ConceptQuestion
            key={`${concept.slug}:${current}`}
            concept={concept}
            question={current}
          />
          <div className="mt-3 flex items-center justify-between text-sm">
            <button
              disabled={current === 0}
              onClick={() => setQuestion(current - 1)}
              className="min-h-[44px] px-2 disabled:opacity-30"
            >
              ← Previous
            </button>
            <span className="font-mono text-xs text-muted-foreground">
              Question {current + 1} / {concept.questions.length}
            </span>
            <button
              disabled={current === concept.questions.length - 1}
              onClick={() => setQuestion(current + 1)}
              className="min-h-[44px] px-2 disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        </>
      ) : (
        <p className="py-10 text-sm text-muted-foreground">
          {revisit
            ? 'No concepts marked for revisit match this search.'
            : 'No concepts match this search.'}
        </p>
      )}
    </div>
  );
}
