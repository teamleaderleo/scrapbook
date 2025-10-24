"use client";

type ListRowSkeletonProps = { expanded?: boolean };

export function SpaceSkeleton() {
  return (
    <div className="flex w-full min-h-screen bg-background text-foreground">
      {/* Sidebar rail approximation: matches your real sidebar width on md+ */}
      <aside className="hidden md:flex flex-col border-r border-border w-64 shrink-0">
        {/* Sidebar header (height synced to header for visual continuity) */}
        <div className="h-12 border-b border-border px-4 flex items-center">
          <div className="h-4 w-28 rounded bg-muted animate-pulse" />
        </div>

        {/* Sidebar search/control */}
        <div className="p-3 border-b">
          <div className="h-9 w-full rounded bg-muted/60 animate-pulse" />
        </div>

        {/* Sidebar groups */}
        <div className="p-3 space-y-4">
          <SidebarGroupSkeleton />
          <SidebarGroupSkeleton />
          <SidebarGroupSkeleton />
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header: h-12 + border-b, tokenized surfaces for dark mode */}
        <div className="h-12 border-b border-border bg-background px-6 flex items-center justify-between">
          <div className="h-4 w-56 rounded bg-muted animate-pulse" />
          <div className="hidden sm:flex items-center gap-3">
            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
          </div>
        </div>

        {/* Results list skeleton */}
        <main className="p-4">
          <ul className="space-y-2">
            <ListRowSkeleton />
            <ListRowSkeleton />
            <ListRowSkeleton expanded />
            <ListRowSkeleton />
            <ListRowSkeleton />
          </ul>

          {/* Pagination controls hint */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <div className="h-8 w-20 rounded bg-muted animate-pulse" />
            <div className="h-4 w-28 rounded bg-muted animate-pulse" />
            <div className="h-8 w-20 rounded bg-muted animate-pulse" />
          </div>
        </main>
      </div>

      {/* Editor panel placeholder (matches your editor panel region) */}
      <div className="hidden xl:block w-[420px] border-l border-border bg-card/30">
        <div className="p-4">
          <div className="h-5 w-40 rounded bg-muted animate-pulse mb-3" />
          <div className="h-8 w-full rounded bg-muted/60 animate-pulse mb-2" />
          <div className="h-8 w-11/12 rounded bg-muted/60 animate-pulse mb-2" />
          <div className="h-8 w-10/12 rounded bg-muted/60 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function SidebarGroupSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-3 w-24 rounded bg-muted/80 animate-pulse" />
      <div className="space-y-2">
        <div className="h-8 w-full rounded bg-muted/60 animate-pulse" />
        <div className="h-8 w-full rounded bg-muted/60 animate-pulse" />
        <div className="h-8 w-2/3 rounded bg-muted/60 animate-pulse" />
      </div>
    </div>
  );
}

function ListRowSkeleton({ expanded = false }: ListRowSkeletonProps) {
  return (
    <li className="rounded border bg-white dark:bg-sidebar border-border dark:border-sidebar-border text-foreground dark:text-sidebar-foreground">
      {/* Row header */}
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-4 w-40 rounded bg-muted animate-pulse" />
            <div className="h-6 w-16 rounded bg-muted/60 animate-pulse" />
            <div className="h-6 w-16 rounded bg-muted/60 animate-pulse" />
            <div className="h-6 w-16 rounded bg-muted/60 animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-14 rounded bg-muted/70 animate-pulse" />
            <div className="h-4 w-4 rounded bg-muted/70 animate-pulse" />
          </div>
        </div>
        <div className="mt-1 h-3 w-2/3 rounded bg-muted/70 animate-pulse" />
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-border p-3">
          <div className="flex gap-3">
            <div className="flex-1 min-w-0">
              <div className="p-3 rounded overflow-hidden bg-white dark:bg-sidebar border border-border dark:border-sidebar-border">
                <div className="space-y-2">
                  <div className="h-3 w-11/12 rounded bg-muted/70 animate-pulse" />
                  <div className="h-3 w-10/12 rounded bg-muted/70 animate-pulse" />
                  <div className="h-3 w-9/12 rounded bg-muted/70 animate-pulse" />
                  <div className="h-24 w-full rounded bg-muted/60 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Side code/info panel stub */}
            <div className="hidden md:block w-[320px] shrink-0">
              <div className="p-3 rounded border border-border bg-card/40">
                <div className="h-4 w-24 rounded bg-muted/70 animate-pulse mb-2" />
                <div className="h-24 w-full rounded bg-muted/60 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      )}
    </li>
  );
}
