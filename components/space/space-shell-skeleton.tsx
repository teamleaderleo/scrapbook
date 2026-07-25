function Line({ className = '' }: { className?: string }) {
  return <span className={`block rounded bg-black/10 dark:bg-white/10 ${className}`} aria-hidden="true" />;
}

function SidebarRows({ count }: { count: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex h-9 items-center gap-2 rounded-md px-3">
          <Line className="h-4 w-4 shrink-0 rounded-sm" />
          <Line className={`h-4 ${index % 3 === 0 ? 'w-28' : index % 3 === 1 ? 'w-20' : 'w-24'}`} />
        </div>
      ))}
    </div>
  );
}

function ItemRow({ index }: { index: number }) {
  return (
    <li className="rounded border border-border bg-white p-3 dark:border-sidebar-border dark:bg-sidebar">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Line className={`h-5 ${index % 2 === 0 ? 'w-44' : 'w-56'} max-w-full`} />
            <Line className="h-7 w-12" />
            <Line className="h-7 w-14" />
          </div>
          <Line className="mt-2 h-3 w-64 max-w-full" />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Line className="h-3 w-14" />
          <Line className="h-4 w-4" />
        </div>
      </div>
    </li>
  );
}

export function SpaceShellSkeleton() {
  return (
    <div className="flex h-dvh min-h-0 w-full min-w-0 overflow-hidden bg-background text-foreground motion-safe:animate-pulse" role="status" aria-label="Loading Space">
      <aside className="hidden h-full w-64 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex h-12 shrink-0 items-center justify-between border-b px-4">
          <span className="text-lg font-bold leading-none">teamleaderleo</span>
          <Line className="h-8 w-8 rounded-md" />
        </div>
        <div className="shrink-0 border-b p-3">
          <div className="flex h-10 items-center gap-2 rounded-md bg-muted/60 px-3">
            <Line className="h-4 w-4" />
            <Line className="h-4 w-20" />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden py-3">
          <p className="px-4 text-xs font-medium text-muted-foreground">View</p>
          <SidebarRows count={2} />
          <p className="mt-4 px-4 text-xs font-medium text-muted-foreground">Shortcuts</p>
          <SidebarRows count={6} />
        </div>
        <div className="shrink-0 space-y-2 border-t p-3">
          <Line className="h-4 w-36" />
          <Line className="h-9 w-full" />
        </div>
      </aside>

      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-12 shrink-0 items-center justify-between border-b bg-background px-3 sm:px-4">
          <div className="flex items-center gap-3">
            <Line className="h-8 w-8 rounded-md md:hidden" />
            <Line className="h-4 w-24" />
          </div>
          <Line className="h-8 w-20" />
        </header>

        <main className="min-h-0 flex-1 overflow-hidden px-3 py-3 sm:p-4">
          <ul className="space-y-2">
            {Array.from({ length: 7 }, (_, index) => (
              <ItemRow key={index} index={index} />
            ))}
          </ul>
        </main>
      </div>
    </div>
  );
}
