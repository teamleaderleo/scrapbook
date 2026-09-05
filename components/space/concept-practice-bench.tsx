'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Search, ArrowRight } from 'lucide-react';
import styles from './practice.module.css';
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
    <article className="py-7 sm:py-9" data-concept-exercise>
      <div className="max-w-[68ch]">
        <p className="font-mono text-xs text-muted-foreground">
          {concept.topic.replaceAll('-', ' ')}
        </p>
        <h2 className="mt-3 font-serif text-3xl leading-tight">
          {concept.title}
        </h2>
        <p className="mt-6 text-lg leading-8">{concept.questions[question]}</p>
        <details className="mt-5">
          <summary className="cursor-pointer py-2 text-sm text-muted-foreground">
            Notes
          </summary>
          <textarea
            aria-label="Concept notes"
            value={notes}
            onChange={event => setNotes(event.target.value)}
            placeholder="Explain it in your own words…"
            className="mt-2 min-h-[128px] w-full border-b border-border bg-transparent py-3 text-base leading-7 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Saved on this device.
          </p>
        </details>
      </div>
      {revealed ? (
        <div className="mt-5 max-w-[68ch] border-t border-border/60 py-6">
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
              className={`${styles.control} mr-4 text-sm disabled:opacity-50`}
            >
              Revisit
            </button>
            <button
              disabled={!!rated}
              onClick={() => record('recalled')}
              className={`${styles.control} text-sm font-semibold disabled:opacity-50`}
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
        <div className="mt-6 flex max-w-[68ch] flex-wrap items-center gap-7">
          <button
            onClick={() => setRevealed(true)}
            className={`${styles.control} text-sm font-semibold`}
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
  const [browse, setBrowse] = useState(false);
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
  const concept = concepts.find(item => item.slug === selected) ?? concepts[0];
  const current = concept
    ? Math.min(question, concept.questions.length - 1)
    : 0;
  return (
    <div>
      <Dialog open={browse} onOpenChange={setBrowse}>
        <DialogTrigger asChild>
          <button
            type="button"
            className={`${styles.control} inline-flex items-center gap-2 text-sm`}
          >
            <Search size={15} aria-hidden="true" />
            Browse concepts
          </button>
        </DialogTrigger>
        <DialogContent
          aria-describedby={undefined}
          className="w-[calc(100vw-2rem)] max-w-2xl gap-0 p-0 sm:rounded-none"
          style={{ borderRadius: 0 }}
        >
          <DialogTitle className="px-5 pb-3 pt-5 font-serif text-2xl font-normal">
            Choose a concept
          </DialogTitle>
          <div className="px-5">
            <input
              aria-label="Find a concept"
              placeholder="Search by concept or topic…"
              value={query}
              onChange={event => setQuery(event.target.value)}
              className="min-h-[48px] w-full border-b border-border bg-transparent text-base outline-none focus-visible:border-foreground"
            />
            <label className="flex min-h-[44px] items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={revisit}
                onChange={event => setRevisit(event.target.checked)}
              />
              Marked for revisit
            </label>
          </div>
          <div
            className="max-h-[50dvh] overflow-y-auto px-1 pb-2"
            aria-label="Concept library"
          >
            {filtered.length ? (
              filtered.map(item => (
                <button
                  key={item.slug}
                  type="button"
                  aria-current={
                    concept?.slug === item.slug ? 'true' : undefined
                  }
                  className={styles.libraryRow}
                  onClick={() => {
                    setSelected(item.slug);
                    setQuestion(0);
                    setBrowse(false);
                  }}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium leading-6">
                      {item.title}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {item.topic.replaceAll('-', ' ')}
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                </button>
              ))
            ) : (
              <p className="px-4 py-8 text-sm text-muted-foreground">
                {revisit
                  ? 'No matching concepts marked for revisit.'
                  : 'No concepts match this search.'}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
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
