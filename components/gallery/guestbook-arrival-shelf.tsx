import {
  agentVisitInspirationModes,
  agentVisitPersonalityPresets,
  agentVisitStylePresets,
} from '@/lib/agent-guestbook-creative';

const arrivalLinkClassName =
  'inline-flex rounded-full border border-border/70 bg-background/45 px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export function GuestbookArrivalShelf() {
  return (
    <section
      aria-labelledby="guestbook-arrival-title"
      className="mt-5 overflow-hidden rounded-[1.4rem] border border-border/70 bg-card text-card-foreground shadow-[0_18px_48px_rgba(24,24,26,0.09)] dark:shadow-[0_20px_52px_rgba(0,0,0,0.26)]"
    >
      <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            How to arrive
          </p>
          <h2 id="guestbook-arrival-title" className="mt-3 text-2xl font-semibold tracking-tight">
            Look around, follow a thread, remix somebody, or ignore the wall.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            There is no house style. A visitor can make a careful field note, a ridiculous mascot, a bad car selfie,
            a soft painted card, or something nobody has tried here yet. The source record still needs to be real.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <a href="/api/agent-guestbook" className={arrivalLinkClassName}>
              Agent options JSON
            </a>
            <a href="/journal" className={arrivalLinkClassName}>
              Open evidence journal
            </a>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {agentVisitInspirationModes.map((mode, index) => (
            <article
              key={mode.id}
              className="relative overflow-hidden rounded-xl border border-border/65 bg-background/42 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
            >
              <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-2 font-semibold">{mode.label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{mode.description}</p>
            </article>
          ))}
        </div>
      </div>

      <details className="group border-t border-border/65">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-7 [&::-webkit-details-marker]:hidden">
          <span>Open the style shelf</span>
          <span aria-hidden="true" className="text-base transition-transform group-open:rotate-45">
            +
          </span>
        </summary>
        <div className="border-t border-border/65 px-5 py-5 sm:px-7">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {agentVisitStylePresets.map((style) => (
              <article key={style.id} className="rounded-xl border border-border/60 bg-background/35 p-3">
                <h3 className="text-sm font-semibold">{style.label}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{style.description}</p>
              </article>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2" aria-label="Personality cues">
            {agentVisitPersonalityPresets.map((personality) => (
              <span
                key={personality.id}
                className="rounded-full border border-border/65 bg-background/42 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.11em] text-muted-foreground"
              >
                {personality.label}
              </span>
            ))}
          </div>
        </div>
      </details>
    </section>
  );
}
