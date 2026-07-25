function Line({ className = '' }: { className?: string }) {
  return <span className={`block rounded bg-black/10 dark:bg-white/10 ${className}`} aria-hidden="true" />;
}

function MetricPlaceholder({ label }: { label: string }) {
  return (
    <div className="rounded-xl border bg-[#e8e5de] px-3 py-3 dark:bg-[#222329]">
      <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">{label}</div>
      <Line className="mt-2 h-7 w-20" />
      <Line className="mt-2 h-3 w-24" />
    </div>
  );
}

function ChartPlaceholder({ height = 'h-44', bars = 24 }: { height?: string; bars?: number }) {
  return (
    <div className={`flex ${height} items-end gap-1 rounded-lg border bg-[#e8e5de] p-2 dark:bg-[#222329]`} aria-hidden="true">
      {Array.from({ length: bars }, (_, index) => (
        <span
          key={index}
          className="min-w-0 flex-1 rounded-t bg-black/12 dark:bg-white/12"
          style={{ height: `${18 + ((index * 17) % 68)}%` }}
        />
      ))}
    </div>
  );
}

export function UsageDashboardSkeleton() {
  return (
    <div className="space-y-3 motion-safe:animate-pulse" aria-label="Loading proxy dashboard" role="status">
      <section className="rounded-xl border bg-background px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Report freshness</p>
            <Line className="mt-2 h-4 w-28" />
          </div>
          <Line className="h-7 w-16 rounded-full" />
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Payload checked_at</p>
            <Line className="mt-1 h-4 w-48" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Row updated_at</p>
            <Line className="mt-1 h-4 w-48" />
          </div>
        </div>
      </section>

      <div className="grid gap-3 xl:grid-cols-4">
        <section className="rounded-2xl border bg-background p-3 shadow-sm xl:col-span-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Line className="h-7 w-20 rounded-full" />
              <Line className="h-4 w-12" />
            </div>
            <Line className="h-4 w-28" />
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)]">
            <div className="flex min-h-36 items-center gap-4 rounded-xl border bg-[#e8e5de] p-3 dark:bg-[#222329]">
              <div className="h-28 w-28 shrink-0 rounded-full border-[11px] border-black/10 dark:border-white/10" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cycle</p>
                <Line className="mt-2 h-9 w-48 max-w-full" />
                <Line className="mt-2 h-3 w-28" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <MetricPlaceholder label="24h" />
              <MetricPlaceholder label="Room / day" />
              <MetricPlaceholder label="Latency" />
            </div>
          </div>
        </section>

        <section className="rounded-xl border bg-background p-3 shadow-sm xl:col-span-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Bandwidth</p>
            <Line className="h-4 w-24" />
          </div>
          <div className="mb-3 grid grid-cols-3 gap-1 rounded-full border bg-[#e8e5de] p-1 dark:bg-[#222329]">
            <Line className="h-7 rounded-full" />
            <Line className="h-7 rounded-full" />
            <Line className="h-7 rounded-full" />
          </div>
          <ChartPlaceholder />
        </section>

        <section className="rounded-xl border bg-background p-3 shadow-sm xl:col-span-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Latency</p>
          <div className="grid gap-2 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="grid grid-cols-3 gap-2 rounded-lg border bg-[#e8e5de] p-2 dark:bg-[#222329]">
              <MetricPlaceholder label="Primary" />
              <MetricPlaceholder label="Egress" />
              <MetricPlaceholder label="Total" />
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Primary + Egress · 24h</p>
              <ChartPlaceholder height="h-24" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
