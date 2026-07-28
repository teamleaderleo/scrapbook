import { PageCurl, PressedSprig, StitchedRule } from '@/components/cozy-flourishes';
import { PaperCreature } from '@/components/paper-creature';
import ViewportPageShell from '@/components/viewport-page-shell';
import {
  agentJournalEntries,
  type AgentJournalApprovalMode,
  type AgentJournalEvidenceKind,
} from '@/lib/agent-journal';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Agent journal',
  description: 'Evidence-backed execution records from the Scrapbook agent pod.',
  alternates: { canonical: '/journal' },
};

const contributionGuideUrl =
  'https://github.com/teamleaderleo/scrapbook/blob/main/docs/agent-journal.md';

const evidenceKindLabels: Record<AgentJournalEvidenceKind, string> = {
  issue: 'Issue',
  'pull-request': 'Pull request',
  commit: 'Commit',
  'workflow-run': 'Workflow run',
  deployment: 'Deployment',
  conversation: 'Conversation',
};

const approvalLabels: Record<AgentJournalApprovalMode, string> = {
  'human-directed': 'Human directed',
  'maintainer-reviewed': 'Maintainer reviewed',
  'signed-import': 'Signed import',
};

function formatOccurredAt(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
    hour12: false,
  }).format(new Date(value));
}

export default function AgentJournalPage() {
  return (
    <ViewportPageShell
      className="bg-background text-foreground"
      contentClassName="relative min-h-[calc(100dvh-3rem)] overflow-x-hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-45 dark:opacity-18"
        style={{
          backgroundImage:
            'linear-gradient(rgba(54,48,40,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(54,48,40,0.045) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <main className="relative mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <header className="relative overflow-hidden rounded-[1.4rem] border border-border/70 bg-card text-card-foreground shadow-[0_24px_60px_rgba(24,24,26,0.1)] dark:shadow-[0_26px_70px_rgba(0,0,0,0.32)]">
          <PressedSprig className="absolute right-4 top-2 hidden rotate-[10deg] opacity-20 sm:block" />
          <PageCurl className="opacity-60" />
          <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,0.42fr)] lg:items-end">
            <div>
              <span className="material-label-stamped text-[9px] text-muted-foreground">repository-backed record</span>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Agent journal</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                Execution notes with exact timestamps, approval modes, and inspectable evidence. Creative visitor cards remain in the gallery; this ledger records work that can be checked.
              </p>
            </div>

            <div className="material-paper relative overflow-hidden rounded-xl border p-4">
              <span className="material-tape-strip" data-side="top" aria-hidden="true" />
              <div className="flex items-start gap-3">
                <PaperCreature
                  pose="archivist"
                  size="md"
                  label="Scraplet filing records in the agent journal"
                />
                <div className="min-w-0">
                  <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em]">Archive desk</p>
                  <p className="mt-1 text-sm opacity-70">
                    <span>
                      {agentJournalEntries.length}{' '}
                      {agentJournalEntries.length === 1 ? 'entry' : 'entries'}
                    </span>
                    <span aria-hidden="true"> · </span>
                    <span>newest first · UTC</span>
                  </p>
                </div>
              </div>
              <StitchedRule className="mt-3" />
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 font-mono text-[9px] font-semibold uppercase tracking-[0.12em]">
                <a
                  href="/api/agent-journal"
                  className="rounded-sm opacity-65 underline decoration-current/35 underline-offset-4 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  JSON feed
                </a>
                <a
                  href={contributionGuideUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-sm opacity-65 underline decoration-current/35 underline-offset-4 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Append guide
                </a>
                <Link
                  href="/gallery"
                  className="rounded-sm opacity-65 underline decoration-current/35 underline-offset-4 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Guestbook
                </Link>
              </div>
              <PageCurl className="h-6 w-6 opacity-60 [&>span]:h-6 [&>span]:w-6" />
            </div>
          </div>
        </header>

        <section aria-labelledby="journal-records-heading" className="mt-5">
          <div className="flex items-end justify-between gap-4 px-1">
            <div>
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Evidence ledger
              </p>
              <h2 id="journal-records-heading" className="mt-1 text-xl font-semibold tracking-tight">
                Recorded work
              </h2>
            </div>
            <p className="font-mono text-[9px] uppercase tracking-[0.13em] text-muted-foreground">
              Open each folder for evidence
            </p>
          </div>
          <StitchedRule className="mt-3" />

          <ol className="mt-4 grid gap-4">
            {agentJournalEntries.map((entry, index) => (
              <li key={entry.id} data-journal-entry={entry.id}>
                <article className="relative overflow-hidden rounded-xl border border-border/70 bg-card text-card-foreground shadow-[0_12px_34px_rgba(24,24,26,0.08)] transition-[transform,box-shadow] duration-150 hover:-rotate-[0.06deg] hover:shadow-[0_16px_40px_rgba(24,24,26,0.11)] dark:shadow-[0_14px_38px_rgba(0,0,0,0.26)]">
                  <div
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 w-1.5 bg-[#9baa88]"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute right-4 top-0 h-3 w-9 -translate-y-1/2 rotate-[2deg] border border-[#9d8764]/20 bg-[#d9c795]/55 opacity-70"
                  />
                  <div className="grid min-w-0 gap-5 p-4 pl-6 sm:p-5 sm:pl-7 lg:grid-cols-[minmax(0,1fr)_15rem]">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="material-label-stamped text-[10px] text-foreground">
                          {entry.insignia}
                        </span>
                        <span className="font-mono text-[9px] uppercase tracking-[0.13em] text-muted-foreground">
                          Record {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="rounded-full border border-border/65 bg-background/35 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.11em] text-muted-foreground">
                          {approvalLabels[entry.approval.mode]}
                        </span>
                      </div>

                      <h3 className="mt-4 text-xl font-semibold tracking-tight">{entry.codename}</h3>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{entry.note}</p>

                      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                        <div className="min-w-0 rounded-lg border border-dashed border-border/60 bg-background/35 p-3">
                          <dt className="font-mono text-[9px] uppercase tracking-[0.13em] text-muted-foreground">
                            Repository
                          </dt>
                          <dd className="mt-1 break-all font-mono text-xs text-foreground">{entry.repository}</dd>
                        </div>
                        <div className="min-w-0 rounded-lg border border-dashed border-border/60 bg-background/35 p-3">
                          <dt className="font-mono text-[9px] uppercase tracking-[0.13em] text-muted-foreground">
                            Runtime
                          </dt>
                          <dd className="mt-1 text-xs text-foreground">
                            {[entry.runtime, entry.model].filter(Boolean).join(' · ')}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div className="flex min-w-0 flex-col gap-3 lg:border-l lg:border-dashed lg:border-border/70 lg:pl-5">
                      <div>
                        <p className="font-mono text-[9px] uppercase tracking-[0.13em] text-muted-foreground">
                          Occurred
                        </p>
                        <time
                          dateTime={entry.occurredAt}
                          className="mt-1 block font-mono text-xs font-semibold text-foreground"
                        >
                          {formatOccurredAt(entry.occurredAt)} UTC
                        </time>
                      </div>

                      <p className="font-mono text-[9px] uppercase tracking-[0.13em] text-muted-foreground">
                        {entry.evidence.length} evidence {entry.evidence.length === 1 ? 'item' : 'items'}
                      </p>

                      {entry.guestbookId ? (
                        <Link
                          href={`/gallery#visit-${entry.guestbookId}`}
                          className="w-fit rounded-sm font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          Guestbook lineage
                        </Link>
                      ) : null}

                      {entry.artifact ? (
                        <a
                          href={entry.artifact.path}
                          className="w-fit rounded-sm font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {entry.artifact.label}
                        </a>
                      ) : null}
                    </div>
                  </div>

                  <details className="group border-t border-dashed border-border/70 bg-background/32" data-journal-provenance>
                    <summary className="cursor-pointer list-none px-6 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground marker:hidden hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                      <span className="inline-flex items-center gap-2">
                        <span aria-hidden="true" className="inline-block w-3 text-center transition-transform group-open:rotate-90">
                          ▸
                        </span>
                        Open evidence folder
                      </span>
                    </summary>
                    <div className="border-t border-dashed border-border/60 px-6 py-4">
                      <ul className="grid gap-2">
                        {entry.evidence.map((evidence) => (
                          <li
                            key={`${entry.id}-${evidence.kind}-${evidence.href}`}
                            className="flex min-w-0 flex-col gap-1 rounded-lg border border-border/60 bg-card/75 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                          >
                            <div className="min-w-0">
                              <p className="font-mono text-[9px] uppercase tracking-[0.13em] text-muted-foreground">
                                {evidenceKindLabels[evidence.kind]}
                              </p>
                              <p className="mt-1 break-words text-sm text-foreground">{evidence.label}</p>
                            </div>
                            <a
                              href={evidence.href}
                              target="_blank"
                              rel="noreferrer"
                              className="w-fit shrink-0 rounded-sm font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              Open evidence
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </details>
                  <PageCurl className="h-6 w-6 opacity-50 [&>span]:h-6 [&>span]:w-6" />
                </article>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </ViewportPageShell>
  );
}
