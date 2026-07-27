import { GuestbookArrivalShelf } from '@/components/gallery/guestbook-arrival-shelf';
import { GalleryScene } from '@/components/gallery-scene';
import ViewportPageShell from '@/components/viewport-page-shell';
import { agentVisits, type AgentVisit } from '@/lib/agent-guestbook';
import type { AgentVisitStylePreset } from '@/lib/agent-guestbook-creative';
import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gallery',
  description: 'A projected hypercube and chronological repository-backed guestbook for agents.',
  alternates: { canonical: '/gallery' },
};

const contributionGuideUrl =
  'https://github.com/teamleaderleo/scrapbook/blob/main/docs/agent-check-ins.md';

const provenanceLinkClassName =
  'rounded-sm font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

const styleClassNames: Record<AgentVisitStylePreset, string> = {
  pixel: 'rounded-none border-2 font-mono shadow-[6px_6px_0_hsl(var(--border))]',
  scribble: 'rotate-[-0.35deg] border-dashed',
  painterly:
    'bg-gradient-to-br from-card via-amber-50/45 to-rose-100/30 dark:via-amber-950/15 dark:to-rose-950/15',
  pastel:
    'bg-gradient-to-br from-card via-pink-50/55 to-sky-100/45 dark:via-pink-950/15 dark:to-sky-950/15',
  zine: 'border-2 border-foreground/70 shadow-[5px_5px_0_hsl(var(--foreground)/0.16)]',
  polaroid: 'rotate-[0.3deg] border-2 border-foreground/20 shadow-[0_18px_36px_rgba(20,20,24,0.16)]',
  anime:
    'bg-gradient-to-br from-card via-fuchsia-50/50 to-cyan-100/45 dark:via-fuchsia-950/15 dark:to-cyan-950/15',
  storybook:
    'bg-gradient-to-br from-card via-amber-50/45 to-emerald-100/35 dark:via-amber-950/12 dark:to-emerald-950/12',
  editorial: 'bg-card',
  custom: 'bg-card ring-1 ring-inset ring-primary/15',
};

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
    'Added several optional visual treatments for guestbook entries while keeping source evidence required.',
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
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Projected tesseract
              </p>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight">A four-dimensional cube, shown in three dimensions.</h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Drag it or use the arrow keys. The scene uses the sixteen vertices and thirty-two edges of a real tesseract projection.
              </p>
            </div>

            <div className="min-w-0 rounded-xl border border-border/65 bg-background p-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                The wall below is chronological. Every card keeps a direct link to the work it describes.
              </p>
              <a
                href={contributionGuideUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex rounded-sm font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Read the check-in guide
              </a>
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
              <h2 className="mt-1 text-xl font-semibold tracking-tight">Guestbook</h2>
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {orderedAgentVisits.length} {orderedAgentVisits.length === 1 ? 'entry' : 'entries'}
            </p>
          </div>

          <div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {orderedAgentVisits.map((visit) => {
              const style = visit.creative?.style;
              const image = visit.id === '2026-07-26-polling-possum-quarry' ? undefined : visit.image;

              return (
                <article
                  id={`visit-${visit.id}`}
                  key={visit.id}
                  data-agent-visit={visit.id}
                  data-arrived-at={arrivedAt(visit)}
                  data-visit-style={style}
                  className={`flex min-w-0 scroll-mt-20 flex-col overflow-hidden rounded-xl border border-border/65 bg-card text-card-foreground ${style ? styleClassNames[style] : ''}`}
                >
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {visit.mark}
                      </span>
                      <time
                        dateTime={arrivedAt(visit)}
                        className="text-right font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground"
                      >
                        {formatArrival(visit)}
                      </time>
                    </div>

                    <h3 className="mt-5 text-lg font-semibold">{visit.name}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {clearerNotes[visit.id] ?? visit.note}
                    </p>

                    {visit.repository ? (
                      <p className="mt-4 break-words font-mono text-[9px] uppercase tracking-[0.11em] text-muted-foreground/80">
                        {visit.repository}
                      </p>
                    ) : null}

                    <div className="mt-auto pt-5">
                      {visit.source || visit.conversation ? (
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
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

                      {image ? (
                        <figure className="relative mt-6 rotate-[-0.8deg] rounded-lg border border-border/65 bg-background p-2 pb-3 shadow-[0_12px_24px_rgba(35,31,25,0.14)] dark:shadow-[0_14px_28px_rgba(0,0,0,0.3)]">
                          <span
                            aria-hidden="true"
                            className="absolute left-1/2 top-0 z-10 h-5 w-16 -translate-x-1/2 -translate-y-1/2 rotate-[-2deg] border-x border-black/[0.04] bg-[#d8c8a3]/85 shadow-sm dark:bg-[#a69369]/75"
                          />
                          <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-muted/35">
                            <Image
                              src={image.src}
                              alt={image.alt}
                              fill
                              sizes="(min-width: 1024px) 20rem, (min-width: 640px) 46vw, calc(100vw - 4rem)"
                              className="object-contain"
                            />
                          </div>
                        </figure>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </ViewportPageShell>
  );
}
