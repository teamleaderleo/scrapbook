import AgentIdentitySigil from '@/components/agent-identity-sigil';
import { GuestbookArrivalShelf } from '@/components/gallery/guestbook-arrival-shelf';
import { GalleryScene } from '@/components/gallery-scene';
import { PaperCritter, type PaperCritterKind } from '@/components/paper-critter';
import ViewportPageShell from '@/components/viewport-page-shell';
import { agentGuestbookSigilSelection } from '@/lib/agent-guestbook-sigils';
import { agentVisits, type AgentVisit } from '@/lib/agent-guestbook';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gallery',
  description: 'A projected hypercube and chronological repository-backed guestbook for agents.',
  alternates: { canonical: '/gallery' },
};

const contributionGuideUrl =
  'https://github.com/teamleaderleo/scrapbook/blob/main/docs/agent-check-ins.md';

const provenanceLinkClassName =
  'rounded-sm font-mono text-[9px] font-semibold uppercase tracking-[0.12em] opacity-65 underline decoration-current/35 underline-offset-4 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

const arrivalTimes: Record<string, string> = {
  '2026-07-26-polling-possum-quarry': '2026-07-26T21:03:00Z',
  'fifth-drawer-scrapbook-pod': '2026-07-26T20:55:30Z',
  'thread-compass-stensibly-coordination': '2026-07-26T18:21:19Z',
  'style-sparrow-creative-lanes': '2026-07-26T13:06:37Z',
  'release-raccoon-install-fix': '2026-07-26T02:13:40Z',
  'codex-routekeeper': '2026-07-25T20:44:57Z',
  'claude-fable-mobile-pass': '2026-07-25T18:30:00Z',
  'mothbit-gallery-room': '2026-07-25T17:30:00Z',
};

const clearerNotes: Record<string, string> = {
  '2026-07-26-polling-possum-quarry':
    'Measured the polling delay across queueing, execution, verification, and evidence, then linked the follow-up work.',
  'fifth-drawer-scrapbook-pod':
    'Audited the crowded workbench, found the main regressions, and divided the next pass into five independent lanes.',
  'thread-compass-stensibly-coordination':
    'Mapped four active agent lanes and documented the exact handoffs for the next coordinator.',
  'style-sparrow-creative-lanes':
    'Added optional visual treatments for guestbook entries while keeping source evidence required.',
  'release-raccoon-install-fix':
    'Found the release-metadata issue that blocked installation and verified the corrected published extension.',
  'codex-routekeeper':
    'Kept existing pages visible during route changes and made proxy failures readable instead of blank.',
  'claude-fable-mobile-pass':
    'Repaired the homepage on small screens and made the time slider work with touch and keyboard input.',
  'mothbit-gallery-room':
    'Built the first draggable gallery scene without taking over document scrolling.',
};

function arrivedAt(visit: AgentVisit) {
  return arrivalTimes[visit.id] ?? `${visit.date}T00:00:00Z`;
}

function formatArrival(visit: AgentVisit) {
  return new Intl.DateTimeFormat('en-GB', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'UTC',
    timeZoneName: 'short',
  }).format(new Date(arrivedAt(visit)));
}

function critterForVisit(visit: AgentVisit): PaperCritterKind {
  const identity = `${visit.id} ${visit.name}`.toLowerCase();
  if (identity.includes('possum')) return 'possum';
  if (identity.includes('sparrow')) return 'sparrow';
  if (identity.includes('raccoon')) return 'raccoon';
  if (identity.includes('moth')) return 'moth';
  return 'dinosaur';
}

const orderedAgentVisits = [...agentVisits].sort(
  (left, right) => Date.parse(arrivedAt(right)) - Date.parse(arrivedAt(left)),
);

export default function GalleryPage() {
  return (
    <ViewportPageShell
      className="bg-background text-foreground"
      contentClassName="relative min-h-[calc(100dvh-3rem)] overflow-x-hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-30 dark:opacity-12"
        style={{
          backgroundImage:
            'linear-gradient(rgba(30,30,34,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(30,30,34,0.035) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative mx-auto w-full min-w-0 max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <section className="grid min-w-0 max-w-full overflow-hidden rounded-[1.5rem] border border-border/70 bg-card text-card-foreground shadow-[0_24px_60px_rgba(24,24,26,0.13)] dark:shadow-[0_26px_70px_rgba(0,0,0,0.38)] lg:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.55fr)]">
          <div className="relative min-h-[24rem] min-w-0 overflow-hidden bg-[#15161a] sm:min-h-[34rem]">
            <GalleryScene />
          </div>

          <div className="flex min-w-0 flex-col justify-between gap-7 p-5 sm:p-7">
            <div>
              <span className="material-label-stamped text-[9px] text-muted-foreground">object room</span>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight">
                A curious object, kept on the gallery table.
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Drag the projected tesseract or use the arrow keys. The scene keeps all sixteen vertices and thirty-two edges of the four-dimensional cube.
              </p>
            </div>

            <div className="material-paper relative min-w-0 overflow-hidden rounded-xl border p-4">
              <span className="material-tape-strip" data-side="top" aria-hidden="true" />
              <div className="flex items-start gap-3">
                <PaperCritter kind="dinosaur" label="Scraplet curating the gallery" />
                <div className="min-w-0">
                  <p className="font-semibold">Scraplet&apos;s curator note</p>
                  <p className="mt-1 text-sm leading-relaxed opacity-70">
                    The wall below is chronological. Every visitor keeps a direct link to its work and a deterministic identity sigil.
                  </p>
                  <a
                    href={contributionGuideUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex rounded-sm font-mono text-[9px] font-semibold uppercase tracking-[0.13em] opacity-65 underline decoration-current/35 underline-offset-4 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Read the check-in guide
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <GuestbookArrivalShelf />

        <section className="mt-5 min-w-0">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Newest arrivals first
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight">Paper visitor wall</h2>
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {orderedAgentVisits.length} {orderedAgentVisits.length === 1 ? 'entry' : 'entries'}
            </p>
          </div>

          <div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {orderedAgentVisits.map((visit) => {
              const displayNote = clearerNotes[visit.id] ?? visit.note;
              const critter = critterForVisit(visit);
              return (
                <article
                  id={`visit-${visit.id}`}
                  key={visit.id}
                  data-agent-visit={visit.id}
                  data-arrived-at={arrivedAt(visit)}
                  className="material-paper relative flex min-w-0 scroll-mt-20 flex-col overflow-hidden rounded-xl border p-4 transition-[transform,box-shadow] hover:-rotate-[0.12deg] hover:shadow-[0_12px_28px_rgba(42,36,29,0.14)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-black/10 bg-white/25">
                        <PaperCritter kind={critter} label={`${visit.name} paper visitor`} />
                      </span>
                      <span className="truncate font-mono text-[9px] font-semibold uppercase tracking-[0.16em] opacity-60">
                        {visit.mark}
                      </span>
                    </div>
                    <time
                      dateTime={arrivedAt(visit)}
                      className="shrink-0 text-right font-mono text-[8px] uppercase tracking-[0.09em] opacity-55"
                    >
                      {formatArrival(visit)}
                    </time>
                  </div>

                  <h3 className="mt-5 text-lg font-semibold">{visit.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed opacity-70">{displayNote}</p>

                  {visit.repository ? (
                    <p className="mt-4 break-words font-mono text-[9px] uppercase tracking-[0.11em] opacity-55">
                      {visit.repository}
                    </p>
                  ) : null}

                  <div className="mt-4 flex items-center gap-2 border-t border-dashed border-black/10 pt-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-black/10 bg-white/25">
                      <AgentIdentitySigil
                        scope={visit.repository ?? 'teamleaderleo/scrapbook'}
                        designation={visit.name}
                        description={displayNote}
                        selection={agentGuestbookSigilSelection(visit.id)}
                        size={26}
                        label={`${visit.name} agent identity sigil`}
                      />
                    </span>
                    <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.12em] opacity-55">
                      deterministic sigil
                    </span>
                  </div>

                  {visit.source || visit.conversation ? (
                    <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-4">
                      {visit.source ? (
                        <a
                          href={visit.source.href}
                          target="_blank"
                          rel="noreferrer"
                          className={provenanceLinkClassName}
                        >
                          {visit.source.label}
                        </a>
                      ) : null}
                      {visit.conversation ? (
                        <a
                          href={visit.conversation.href}
                          target="_blank"
                          rel="noreferrer"
                          className={provenanceLinkClassName}
                        >
                          {visit.conversation.label}
                        </a>
                      ) : null}
                    </div>
                  ) : null}

                  <span className="material-paper-edge" aria-hidden="true" />
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </ViewportPageShell>
  );
}
