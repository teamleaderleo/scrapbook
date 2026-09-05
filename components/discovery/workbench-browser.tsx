'use client';

import Link from 'next/link';
import { CensorReveal } from '@/components/ui/censor-reveal';
import { useBrowseQuery, controlClass } from './browse-controls';

export type WorkbenchListItem = {
  slug: string;
  title: string;
  blurb: string;
  date: string;
  author: string;
  kind: string;
  editorialState: string;
  topics: readonly string[];
};

export function WorkbenchBrowser({
  entries,
}: {
  entries: readonly WorkbenchListItem[];
}) {
  const { query, kind, topic, update, clear } = useBrowseQuery();
  const topics = [...new Set(entries.flatMap(entry => entry.topics))].sort(
    (a, b) => a.localeCompare(b)
  );
  const kinds = [...new Set(entries.map(entry => entry.kind))].sort();
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const filtered = entries.filter(
    entry =>
      (!kind || entry.kind === kind) &&
      (!topic || entry.topics.includes(topic)) &&
      terms.every(term =>
        `${entry.title} ${entry.blurb} ${entry.author} ${entry.topics.join(' ')}`
          .toLocaleLowerCase()
          .includes(term)
      )
  );
  return (
    <section aria-label="Workbench pieces" className="pt-6">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <input
          type="search"
          aria-label="Search writing"
          placeholder="Search writing…"
          value={query}
          onChange={event => update('q', event.target.value)}
          className={`${controlClass} col-span-2 sm:col-span-1`}
        />
        <select
          aria-label="Writing type"
          value={kind}
          onChange={event => update('kind', event.target.value)}
          className={controlClass}
        >
          <option value="">All types</option>
          {kinds.map(value => (
            <option key={value}>{value}</option>
          ))}
        </select>
        <select
          aria-label="Writing topic"
          value={topic}
          onChange={event => update('topic', event.target.value)}
          className={`${controlClass} sm:max-w-56`}
        >
          <option value="">All topics</option>
          {topics.map(value => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </div>
      <div className="flex min-h-[48px] items-center justify-between gap-4 border-b border-border text-xs text-muted-foreground">
        <span role="status">
          {filtered.length} {filtered.length === 1 ? 'piece' : 'pieces'} ·
          newest first
        </span>
        {(query || kind || topic) && (
          <button
            type="button"
            className="min-h-[44px] underline underline-offset-4"
            onClick={clear}
          >
            Clear filters
          </button>
        )}
      </div>
      <ol className="divide-y divide-border">
        {filtered.map(entry => (
          <li key={entry.slug}>
            <article className="grid gap-2 py-5 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-5">
              <time
                dateTime={entry.date}
                className="pt-1 text-xs tabular-nums text-muted-foreground"
              >
                {new Intl.DateTimeFormat('en-GB', {
                  dateStyle: 'medium',
                  timeZone: 'UTC',
                }).format(new Date(`${entry.date}T00:00:00Z`))}
              </time>
              <div className="min-w-0">
                <h2 className="font-serif text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
                  <Link
                    href={`/desk/${entry.slug}`}
                    prefetch={false}
                    className="hover:underline underline-offset-4"
                  >
                    <CensorReveal text={entry.title} />
                  </Link>
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                  <CensorReveal text={entry.blurb} focusable />
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {entry.author} · {entry.kind} · {entry.editorialState}
                </p>
              </div>
            </article>
          </li>
        ))}
      </ol>
      {!filtered.length && (
        <p className="py-8 text-sm text-muted-foreground">
          No pieces match these filters.
        </p>
      )}
    </section>
  );
}
