const SAMPLE_SCORE = 274;

const COUNTER_CANDIDATES = [
  {
    id: 'receipt',
    eyebrow: 'Quietest',
    title: 'Receipt strip',
    note: 'One strong number, a narrow paper strip, and the supporting totals kept subordinate.',
  },
  {
    id: 'tickets',
    eyebrow: 'Closest cousin',
    title: 'Ticket rack',
    note: 'Keeps the four-place rhythm of the current counter but trades flipping sheets for clipped paper tickets.',
  },
  {
    id: 'stamp',
    eyebrow: 'Most character',
    title: 'Stamped tally',
    note: 'Treats the daily number like a mark left on the desk: compact, physical, and a little imperfect.',
  },
] as const;

function ReceiptCounter() {
  return (
    <div
      data-counter-treatment="receipt"
      className="relative w-full max-w-[20rem] overflow-hidden border-y border-dashed border-foreground/20 bg-background/75 px-5 py-6 shadow-[0_12px_24px_rgba(30,28,24,0.08)]"
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-foreground/10"
      />
      <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Today · desk activity
      </p>
      <div className="mt-3 flex items-end justify-between gap-5">
        <strong className="font-serif text-7xl font-semibold leading-none tracking-[-0.06em] tabular-nums">
          {SAMPLE_SCORE}
        </strong>
        <div className="pb-1 text-right font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
          <p>7D · 1,284</p>
          <p className="mt-1">1Y · 18,406</p>
        </div>
      </div>
    </div>
  );
}

function TicketCounter() {
  const digits = String(SAMPLE_SCORE).padStart(4, '0').split('');

  return (
    <div
      data-counter-treatment="tickets"
      className="w-full max-w-[21rem] rounded-2xl border border-border/70 bg-background/55 p-4"
    >
      <p className="mb-3 font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">
        Today · clipped tally
      </p>
      <div className="grid grid-cols-4 gap-2">
        {digits.map((digit, index) => (
          <span
            key={`${digit}-${index}`}
            className="relative grid aspect-[0.72] place-items-center overflow-hidden rounded-[0.45rem] border border-foreground/15 bg-card font-mono text-5xl font-semibold tabular-nums shadow-[0_6px_12px_rgba(30,28,24,0.08)]"
          >
            <span
              aria-hidden="true"
              className="absolute left-1/2 top-0 h-2 w-5 -translate-x-1/2 rounded-b-full border-x border-b border-foreground/15 bg-background"
            />
            {digit}
          </span>
        ))}
      </div>
    </div>
  );
}

function StampCounter() {
  return (
    <div
      data-counter-treatment="stamp"
      className="relative grid min-h-52 w-full max-w-[20rem] place-items-center overflow-hidden rounded-[1.2rem] border border-border/70 bg-background/62 p-5"
    >
      <div
        aria-hidden="true"
        className="absolute inset-4 rounded-[1rem] border border-dashed border-foreground/15"
      />
      <div className="relative -rotate-2 text-center">
        <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Activity stamped today
        </p>
        <strong className="mt-2 block border-y-2 border-foreground/55 px-4 py-1 font-mono text-7xl font-black leading-none tracking-[-0.08em] tabular-nums text-foreground/80">
          {SAMPLE_SCORE}
        </strong>
        <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.15em] text-muted-foreground">
          reset · 00:00 UTC
        </p>
      </div>
    </div>
  );
}

export function ActivityCounterLab() {
  return (
    <section className="mt-8" aria-labelledby="counter-treatment-title">
      <div className="mx-auto max-w-4xl text-center">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Counter treatments · same sample value
        </p>
        <h2
          id="counter-treatment-title"
          className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          Three ways to retire the paper odometer
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          The current scoreboard has charm and a lot of visual machinery. These
          keep the daily number tactile while asking for less attention.
        </p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {COUNTER_CANDIDATES.map(candidate => (
          <article
            key={candidate.id}
            data-counter-candidate={candidate.id}
            className="flex min-w-0 flex-col rounded-[1.25rem] border border-border/70 bg-card p-4 text-card-foreground shadow-[0_16px_38px_rgba(35,31,26,0.08)] dark:shadow-[0_16px_38px_rgba(0,0,0,0.26)]"
          >
            <div className="min-h-28">
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {candidate.eyebrow}
              </p>
              <h3 className="mt-1 text-lg font-semibold tracking-tight">
                {candidate.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {candidate.note}
              </p>
            </div>

            <div className="mt-4 grid min-h-64 flex-1 place-items-center rounded-[1rem] border border-border/55 bg-muted/25 p-3">
              {candidate.id === 'receipt' ? <ReceiptCounter /> : null}
              {candidate.id === 'tickets' ? <TicketCounter /> : null}
              {candidate.id === 'stamp' ? <StampCounter /> : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
