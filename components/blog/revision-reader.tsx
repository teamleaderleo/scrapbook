'use client';

import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { EditorialRevisionBundle } from '@/lib/editorial-revisions';
import type { RedlineSpan } from '@/lib/editorial-diff';

type ArticleView = 'read' | 'redline' | 'versions';

const views: Array<{ id: ArticleView; label: string }> = [
  { id: 'read', label: 'Read' },
  { id: 'redline', label: 'Redline' },
  { id: 'versions', label: 'Versions' },
];

const proseClassName =
  'prose prose-lg max-w-none prose-headings:font-serif prose-headings:tracking-[-0.025em] prose-p:font-serif prose-p:leading-[1.72] prose-a:decoration-current/35 prose-a:underline-offset-4 prose-blockquote:border-current prose-blockquote:font-serif prose-blockquote:text-foreground/75 dark:prose-invert';

function MarkdownCopy({ content }: { content: string }) {
  return (
    <div className={proseClassName}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}

function RedlineText({ spans }: { spans: RedlineSpan[] }) {
  return (
    <p className="m-0 font-serif text-[1.05rem] leading-[1.78]">
      {spans.map((span, index) => {
        if (span.kind === 'removed') {
          return (
            <del
              key={`${span.kind}-${index}`}
              className="rounded-sm bg-[#ead1cd] px-0.5 text-[#7b2825] decoration-[#a8413b] decoration-2 dark:bg-[#4a2929] dark:text-[#ffc7c1]"
            >
              {span.text}
            </del>
          );
        }

        if (span.kind === 'added') {
          return (
            <ins
              key={`${span.kind}-${index}`}
              className="rounded-sm bg-[#dce8d4] px-0.5 text-[#31552c] no-underline dark:bg-[#29402a] dark:text-[#cdf0c8]"
            >
              {span.text}
            </ins>
          );
        }

        return <span key={`${span.kind}-${index}`}>{span.text}</span>;
      })}
    </p>
  );
}

export function RevisionReader({ bundle }: { bundle: EditorialRevisionBundle }) {
  const latest = bundle.versions.at(-1)!;
  const [view, setView] = useState<ArticleView>('read');
  const [selectedRevision, setSelectedRevision] = useState(latest.revision);
  const [changesOnly, setChangesOnly] = useState(false);
  const [openComment, setOpenComment] = useState<string | null>(null);

  const selectedVersion =
    bundle.versions.find((version) => version.revision === selectedRevision) ?? latest;
  const commentsById = useMemo(
    () => new Map(bundle.comments.map((comment) => [comment.id, comment])),
    [bundle.comments],
  );
  const redlineRows = changesOnly
    ? bundle.redline.filter((row) => row.changed || row.commentIds.length > 0)
    : bundle.redline;

  return (
    <section aria-label="Article and revision views" className="min-w-0">
      <div className="mb-7 border-y border-current/30 py-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="tablist" aria-label="Article view" className="flex flex-wrap gap-1">
            {views.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={view === item.id}
                aria-controls={`article-panel-${item.id}`}
                onClick={() => setView(item.id)}
                className={`rounded-full px-3 py-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/50 ${
                  view === item.id
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:bg-foreground/8 hover:text-foreground'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <p className="font-mono text-[9px] uppercase tracking-[0.13em] text-muted-foreground">
            Latest: revision {latest.revision}
          </p>
        </div>
      </div>

      {view === 'read' ? (
        <div id="article-panel-read" role="tabpanel">
          <MarkdownCopy content={latest.content} />
        </div>
      ) : null}

      {view === 'redline' ? (
        <div id="article-panel-redline" role="tabpanel" className="min-w-0">
          {bundle.fromRevision === null ? (
            <p className="font-serif text-xl text-muted-foreground">No earlier stored revision is available.</p>
          ) : (
            <>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-current/20 pb-3">
                <div>
                  <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em]">
                    Revision {bundle.fromRevision} → revision {bundle.toRevision}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Deleted copy is crossed out. New copy is highlighted. Margin notes open inline.
                  </p>
                </div>

                <button
                  type="button"
                  aria-pressed={changesOnly}
                  onClick={() => setChangesOnly((value) => !value)}
                  className="rounded-full border border-current/25 px-3 py-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/50"
                >
                  {changesOnly ? 'Show all rows' : 'Changes only'}
                </button>
              </div>

              <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-[#ead1cd] align-middle dark:bg-[#4a2929]" />Deleted</span>
                <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-[#dce8d4] align-middle dark:bg-[#29402a]" />Added</span>
                <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm border border-current/30 align-middle" />Unchanged</span>
              </div>

              <div className="divide-y divide-current/15 border-y border-current/25">
                {redlineRows.map((row) => {
                  const rowComments = row.commentIds
                    .map((id) => commentsById.get(id))
                    .filter((comment): comment is NonNullable<typeof comment> => Boolean(comment));

                  return (
                    <article
                      key={row.id}
                      data-redline-row
                      className={`grid min-w-0 gap-3 py-4 sm:grid-cols-[2rem_2rem_minmax(0,1fr)] lg:grid-cols-[2rem_2rem_minmax(0,1fr)_10rem] ${
                        row.changed ? '' : 'text-foreground/62'
                      }`}
                    >
                      <span className="font-mono text-[9px] tabular-nums text-muted-foreground" title="Earlier revision row">
                        {row.oldLine ?? '—'}
                      </span>
                      <span className="font-mono text-[9px] tabular-nums text-muted-foreground" title="Latest revision row">
                        {row.newLine ?? '—'}
                      </span>
                      <div className="min-w-0">
                        <RedlineText spans={row.spans} />

                        {rowComments.map((comment) =>
                          openComment === comment.id ? (
                            <div
                              key={comment.id}
                              className="mt-3 rounded-lg border border-current/20 bg-foreground/[0.035] p-3 text-sm leading-relaxed"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.13em]">
                                  {comment.source === 'editor' ? 'Editor note' : 'Self-review'} · {comment.label}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => setOpenComment(null)}
                                  className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground"
                                >
                                  Close
                                </button>
                              </div>
                              <p className="mt-2 text-muted-foreground">{comment.note}</p>
                            </div>
                          ) : null,
                        )}
                      </div>

                      <div className="flex flex-wrap content-start gap-2 sm:col-start-3 lg:col-start-4">
                        {rowComments.map((comment) => (
                          <button
                            key={comment.id}
                            type="button"
                            aria-expanded={openComment === comment.id}
                            onClick={() =>
                              setOpenComment((current) => (current === comment.id ? null : comment.id))
                            }
                            className="rounded-full border border-current/25 px-2 py-1 font-mono text-[8px] font-semibold uppercase tracking-[0.11em] text-muted-foreground hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/50"
                          >
                            {comment.label}
                          </button>
                        ))}
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </div>
      ) : null}

      {view === 'versions' ? (
        <div id="article-panel-versions" role="tabpanel">
          <div className="mb-7 grid gap-3 sm:grid-cols-2">
            {bundle.versions.map((version) => (
              <button
                key={version.revision}
                type="button"
                aria-pressed={selectedRevision === version.revision}
                onClick={() => setSelectedRevision(version.revision)}
                className={`rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/50 ${
                  selectedRevision === version.revision
                    ? 'border-current bg-foreground text-background'
                    : 'border-current/20 hover:border-current/45'
                }`}
              >
                <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.13em]">
                  Revision {version.revision}{version.latest ? ' · Latest' : ''}
                </span>
                <span className={`mt-2 block text-sm ${selectedRevision === version.revision ? 'text-background/75' : 'text-muted-foreground'}`}>
                  {version.label}
                </span>
              </button>
            ))}
          </div>

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-y border-current/25 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
            <span>Showing revision {selectedVersion.revision}</span>
            <span>{selectedVersion.latest ? 'Current article' : 'Stored snapshot'}</span>
          </div>
          <MarkdownCopy content={selectedVersion.content} />
        </div>
      ) : null}
    </section>
  );
}
