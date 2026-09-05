'use client';

import Link from 'next/link';
import type { KnowledgeTrunk } from '@/lib/knowledge';
import { useBrowseQuery, controlClass } from './browse-controls';

export function KnowledgeBrowser({
  trunks,
}: {
  trunks: readonly KnowledgeTrunk[];
}) {
  const { query, topic, update, clear } = useBrowseQuery();
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const filtered = trunks
    .filter(trunk => !topic || trunk.slug === topic)
    .map(trunk => ({
      ...trunk,
      nodes: trunk.nodes.filter(node =>
        terms.every(term =>
          `${node.title} ${node.summary ?? ''} ${trunk.title}`
            .toLocaleLowerCase()
            .includes(term)
        )
      ),
    }))
    .filter(trunk => trunk.nodes.length);
  const count = filtered.reduce(
    (total, trunk) => total + trunk.nodes.length,
    0
  );
  return (
    <section aria-label="Concept browser" className="min-w-0">
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <input
          aria-label="Search concepts"
          type="search"
          placeholder="Search concepts…"
          value={query}
          onChange={event => update('q', event.target.value)}
          className={controlClass}
        />
        <select
          aria-label="Knowledge topic"
          value={topic}
          onChange={event => update('topic', event.target.value)}
          className={`${controlClass} sm:max-w-64`}
        >
          <option value="">All topics</option>
          {trunks.map(trunk => (
            <option key={trunk.slug} value={trunk.slug}>
              {trunk.title}
            </option>
          ))}
        </select>
      </div>
      <div className="flex min-h-[48px] items-center justify-between gap-3 text-xs text-muted-foreground">
        <span role="status">
          {count} {count === 1 ? 'concept' : 'concepts'}
        </span>
        {(query || topic) && (
          <button
            type="button"
            className="min-h-[44px] underline underline-offset-4"
            onClick={clear}
          >
            Clear filters
          </button>
        )}
      </div>
      <div className="grid gap-x-7 gap-y-6 sm:grid-cols-2">
        {filtered.map(trunk => (
          <section
            key={trunk.slug}
            className="min-w-0 border-t border-border pt-3"
          >
            <h2 className="text-base font-semibold">
              <Link
                href={`/knowledge/${trunk.slug}`}
                className="hover:underline underline-offset-4"
              >
                {trunk.title}
              </Link>
            </h2>
            <ul className="mt-2 divide-y divide-border/50">
              {trunk.nodes.map(node => (
                <li key={node.slug}>
                  <Link
                    href={`/knowledge/${node.slug}`}
                    prefetch={false}
                    className="flex min-h-[44px] items-center py-2 text-sm text-muted-foreground hover:text-foreground hover:underline underline-offset-4"
                  >
                    {node.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      {!filtered.length && (
        <p className="py-8 text-sm text-muted-foreground">
          No concepts match these filters.
        </p>
      )}
    </section>
  );
}
