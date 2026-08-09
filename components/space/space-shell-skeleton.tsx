import { Skeleton } from '@/components/ui/skeleton';
import { SPACE_LANES } from '@/lib/space-lanes';

function SidebarRow({ width }: { width: string }) {
  return (
    <div className="flex h-8 items-center rounded-lg px-3">
      <Skeleton className={`h-3.5 ${width}`} />
    </div>
  );
}

function LaneCard({ label, index }: { label: string; index: number }) {
  return (
    <div
      className="min-h-28 snap-start rounded-xl border border-border/65 bg-background/60 p-3"
      data-space-loading-lane
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-semibold tracking-tight">{label}</span>
        <Skeleton className="h-2.5 w-5 rounded-full" />
      </div>
      <div className="mt-3 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className={`h-3 ${index % 2 === 0 ? 'w-4/5' : 'w-2/3'}`} />
      </div>
    </div>
  );
}

function ItemRow({ index }: { index: number }) {
  return (
    <li
      className="material-paper relative overflow-hidden rounded-xl border px-4 py-3.5 pl-5"
      data-space-loading-row
    >
      <span
        aria-hidden="true"
        className="absolute left-0 top-4 h-11 w-1.5 rounded-r-full bg-[#9baa88]/55"
      />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton
              className={`h-5 ${index % 2 === 0 ? 'w-44' : 'w-56'} max-w-[72%]`}
            />
            <Skeleton className="h-5 w-11 rounded-full" />
          </div>
          <div className="mt-2 flex gap-1.5">
            <Skeleton className="h-4 w-16 rounded-full" />
            <Skeleton className="h-4 w-20 rounded-full" />
          </div>
        </div>
        <Skeleton className="mt-1 h-4 w-14 shrink-0" />
      </div>
    </li>
  );
}

export function SpaceShellSkeleton() {
  return (
    <div
      className="flex h-[100dvh] min-h-[100dvh] w-full min-w-0 overflow-hidden bg-background text-foreground"
      role="status"
      aria-label="Loading Space"
      aria-busy="true"
      data-space-loading-shell
    >
      <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-border/70 bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border/70 px-4">
          <div>
            <span className="block text-base font-semibold leading-none tracking-[-0.025em]">
              teamleaderleo
            </span>
            <span className="mt-1 block font-mono text-[8px] uppercase tracking-[0.18em] text-muted-foreground">
              space
            </span>
          </div>
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>

        <div className="shrink-0 border-b border-dashed border-border/70 p-3">
          <div className="material-paper flex h-10 items-center gap-2 rounded-lg border px-3">
            <Skeleton className="h-4 w-4 shrink-0 rounded-sm" />
            <Skeleton className="h-3.5 w-24" />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden py-3">
          <Skeleton className="mx-4 mb-2 h-2.5 w-14" />
          <div className="space-y-0.5 px-2">
            <SidebarRow width="w-20" />
            <SidebarRow width="w-28" />
            <SidebarRow width="w-16" />
            <SidebarRow width="w-24" />
            <SidebarRow width="w-20" />
          </div>
          <Skeleton className="mx-4 mb-2 mt-5 h-2.5 w-12" />
          <div className="space-y-0.5 px-2">
            <SidebarRow width="w-28" />
            <SidebarRow width="w-20" />
            <SidebarRow width="w-24" />
          </div>
        </div>

        <div className="shrink-0 space-y-2 border-t border-dashed border-border/70 p-3">
          <Skeleton className="h-8 w-full rounded-lg" />
          <Skeleton className="h-8 w-full rounded-lg" />
        </div>
      </aside>

      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-dashed border-border/75 bg-background/88 px-2 sm:px-4">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="hidden h-8 w-20 rounded-lg sm:block" />
          <Skeleton className="h-2.5 w-24" />
          <span className="flex-1" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </header>

        <main className="relative min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:p-5">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-45 dark:opacity-20"
            style={{
              backgroundImage:
                'linear-gradient(rgba(67,58,46,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(67,58,46,0.035) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          <div className="relative mx-auto w-full max-w-5xl">
            <section className="mb-4 px-1">
              <h1 className="text-xl font-semibold tracking-[-0.025em] sm:text-2xl">
                Space
              </h1>
            </section>

            <div
              className="-mx-3 mb-5 grid snap-x snap-mandatory grid-flow-col auto-cols-[min(76vw,15rem)] gap-2 overflow-hidden px-3 pb-2 sm:mx-0 sm:grid-flow-row sm:grid-cols-2 sm:px-0 lg:grid-cols-4"
              data-space-loading-lanes
            >
              {SPACE_LANES.map((lane, index) => (
                <LaneCard key={lane.id} label={lane.label} index={index} />
              ))}
            </div>

            <ul className="grid gap-3">
              {Array.from({ length: 5 }, (_, index) => (
                <ItemRow key={index} index={index} />
              ))}
            </ul>
          </div>
        </main>
      </div>
    </div>
  );
}
