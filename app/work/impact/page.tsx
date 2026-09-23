import ViewportPageShell from '@/components/viewport-page-shell';
import { impactIndex, impactSummary } from '@/lib/work-impact';
import impactSyncState from '@/work/impact/sources/sync-state.json';
import { ArrowUpRight } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Engineering impact',
  description:
    'Evidence-backed measurements, baselines, reductions, capacity shifts, and reliability results from engineering work.',
  alternates: { canonical: '/work/impact' },
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(new Date(value.length === 10 ? value + 'T00:00:00.000Z' : value));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 1,
  }).format(value);
}

export default function WorkImpactPage() {
  const cmuxSource = impactSyncState.sources.find(
    source => source.repository === 'manaflow-ai/cmux'
  );

  return (
    <ViewportPageShell
      className="bg-background text-foreground"
      contentClassName="min-h-[calc(100dvh-3rem)]"
    >
      <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-7 sm:px-6 sm:pt-10 lg:px-8">
        <header className="grid gap-7 border-y border-border py-7 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)] lg:items-end lg:py-10">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Evidence ledger · updated {formatDate(impactIndex.updatedAt)}
            </p>
            <h1 className="mt-3 max-w-5xl text-[clamp(3rem,9vw,7rem)] font-black leading-[0.84] tracking-[-0.07em]">
              Engineering impact
            </h1>
            <p className="mt-6 max-w-3xl text-lg font-medium leading-8 text-foreground/78 sm:text-xl">
              Measurements and consequences kept close to their receipts.
              Baselines, reductions, capacity shifts, and derived estimates stay
              distinct so a big number can still be audited later.
            </p>
          </div>

          <div className="border-l-2 border-border pl-4 text-sm leading-7 text-muted-foreground">
            <p>
              The raw pull-request snapshot is a retrieval aid. Curated records
              carry the claims; originating repositories remain authoritative.
            </p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">
              <a
                href="/api/work-impact"
                className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
              >
                Query JSON
              </a>
              <a
                href="/data/impact-summary-v1.json"
                className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
              >
                Compact summary
              </a>
              <a
                href="/api/work-impact/candidates?q=latency"
                className="text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
              >
                Search PR candidates
              </a>
            </div>
          </div>
        </header>

        <section
          aria-labelledby="impact-ledger-counts"
          className="grid border-b border-border sm:grid-cols-2 lg:grid-cols-4"
        >
          <h2 id="impact-ledger-counts" className="sr-only">
            Ledger counts
          </h2>
          {[
            ['Merged CMUX PRs indexed', cmuxSource?.totalMergedInSnapshot ?? 0],
            ['Curated records', impactIndex.recordCount],
            ['Quantitative claims', impactSummary.claimCount],
            ['Additive totals', impactSummary.additiveTotals.length],
          ].map(([label, value], index) => (
            <div
              key={String(label)}
              className={[
                'border-b border-border py-5',
                index % 2 === 0 ? 'sm:border-r' : '',
                index < 3 ? 'lg:border-r' : 'lg:border-r-0',
                'lg:border-b-0',
              ].filter(Boolean).join(' ')}
            >
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                {label}
              </p>
              <p className="mt-2 text-4xl font-black tracking-[-0.05em]">
                {value}
              </p>
            </div>
          ))}
        </section>

        <section className="grid gap-8 border-b border-border py-8 lg:grid-cols-[13rem_minmax(0,1fr)]">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Headline claims
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Every row carries its confidence and direction. The ledger has no
              grand dollar total yet.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] border-collapse text-left">
              <thead>
                <tr className="border-y border-border font-mono text-[9px] uppercase tracking-[0.13em] text-muted-foreground">
                  <th className="py-2 pr-4 font-semibold">Claim</th>
                  <th className="py-2 pr-4 font-semibold">Value</th>
                  <th className="py-2 pr-4 font-semibold">Confidence</th>
                  <th className="py-2 pr-4 font-semibold">Direction</th>
                  <th className="py-2 font-semibold">Evidence</th>
                </tr>
              </thead>
              <tbody>
                {impactSummary.headlineClaims.map(claim => (
                  <tr
                    key={claim.recordId + ':' + claim.id}
                    className="border-b border-border text-sm"
                  >
                    <td className="py-3 pr-4">
                      <span className="font-semibold">{claim.title}</span>
                      <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                        {claim.metric}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs tabular-nums">
                      {formatNumber(claim.value)} {claim.unit}
                    </td>
                    <td className="py-3 pr-4">{claim.confidence}</td>
                    <td className="py-3 pr-4">{claim.direction}</td>
                    <td className="py-3">
                      <a
                        href={claim.evidence}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 font-semibold underline decoration-border underline-offset-4 hover:decoration-foreground"
                      >
                        PR / issue
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-8 pt-8 lg:grid-cols-[13rem_minmax(0,1fr)]">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Curated records
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Search and filter the same data through /api/work-impact.
            </p>
          </div>

          <ol className="grid gap-10">
            {impactIndex.records.map(record => (
              <li
                key={record.id}
                id={record.id}
                className="scroll-mt-20 border-t border-border pt-5"
              >
                <article>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        {record.repository} · {record.kind} · {record.status}
                      </p>
                      <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] sm:text-3xl">
                        {record.title}
                      </h2>
                    </div>
                    <span className="font-mono text-[9px] uppercase tracking-[0.11em] text-muted-foreground">
                      {formatDate(record.happenedAt)}
                    </span>
                  </div>

                  <p className="mt-4 max-w-4xl text-base leading-7 text-foreground/78">
                    {record.summary}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-x-3 gap-y-2">
                    {record.areas.map(area => (
                      <span
                        key={area}
                        className="font-mono text-[9px] font-semibold uppercase tracking-[0.11em] text-muted-foreground"
                      >
                        {area}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
                    <ul className="divide-y divide-border border-y border-border">
                      {record.claims.length ? (
                        record.claims.map(claim => (
                          <li key={claim.id} className="py-3 text-sm leading-6">
                            <span className="font-semibold">
                              {formatNumber(claim.value)} {claim.unit}
                            </span>
                            <span className="ml-2 text-muted-foreground">
                              {claim.confidence} · {claim.direction}
                            </span>
                            {claim.note ? (
                              <p className="mt-1 text-foreground/72">
                                {claim.note}
                              </p>
                            ) : null}
                          </li>
                        ))
                      ) : (
                        <li className="py-3 text-sm leading-6 text-muted-foreground">
                          Investigation record; no quantitative impact claim has
                          been promoted yet.
                        </li>
                      )}
                    </ul>

                    <aside>
                      <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        Primary evidence
                      </p>
                      <a
                        href={record.evidence.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline decoration-border underline-offset-4 hover:decoration-foreground"
                      >
                        {record.evidence.label}
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                      <p className="text-xs leading-5 text-muted-foreground">
                        {record.evidence.basis}
                      </p>
                    </aside>
                  </div>
                </article>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </ViewportPageShell>
  );
}
