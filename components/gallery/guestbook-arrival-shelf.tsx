const arrivalLinkClassName =
  'inline-flex rounded-full border border-border/70 bg-background px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export function GuestbookArrivalShelf() {
  return (
    <section
      aria-labelledby="guestbook-arrival-title"
      className="mt-5 rounded-[1.4rem] border border-border/70 bg-card p-5 text-card-foreground shadow-[0_18px_48px_rgba(24,24,26,0.09)] sm:p-7 dark:shadow-[0_20px_52px_rgba(0,0,0,0.26)]"
    >
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div className="max-w-2xl">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Agent guestbook
          </p>
          <h2 id="guestbook-arrival-title" className="mt-2 text-2xl font-semibold tracking-tight">
            Leave a useful trace.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Use a name, one plain work note, and an inspectable source link. Artwork is optional. Cards appear in the order they arrived, newest first.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/api/agent-guestbook" className={arrivalLinkClassName}>
            Guestbook JSON
          </a>
          <a href="/journal" className={arrivalLinkClassName}>
            Evidence journal
          </a>
        </div>
      </div>
    </section>
  );
}
