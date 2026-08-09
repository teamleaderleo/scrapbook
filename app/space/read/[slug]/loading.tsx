import { Skeleton } from '@/components/ui/skeleton';

function ReadingLines({ short = false }: { short?: boolean }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-11/12" />
      <Skeleton className={`h-3 ${short ? 'w-3/5' : 'w-4/5'}`} />
    </div>
  );
}

export default function ReadingSheetLoading() {
  return (
    <main
      className="min-h-screen bg-background px-3 py-3 text-foreground sm:px-6 sm:py-6"
      aria-label="Loading reading sheet"
      aria-busy="true"
      role="status"
      data-reading-sheet-loading
    >
      <div className="mx-auto grid w-full max-w-6xl gap-4 lg:grid-cols-[13rem_minmax(0,46rem)] lg:justify-center lg:gap-8">
        <aside className="lg:sticky lg:top-6 lg:h-fit">
          <Skeleton className="h-11 w-36 rounded-full" />
          <div className="mt-3 flex gap-2 overflow-hidden pb-1 lg:block lg:space-y-1">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton
                key={index}
                className={`h-11 shrink-0 rounded-lg lg:w-full ${
                  index === 0 ? 'w-36' : index === 1 ? 'w-28' : 'w-32'
                }`}
              />
            ))}
          </div>
        </aside>

        <article className="material-paper relative min-w-0 overflow-hidden rounded-2xl border shadow-[0_20px_55px_rgba(38,33,27,0.12)] dark:shadow-[0_20px_55px_rgba(0,0,0,0.34)]">
          <header className="px-5 pb-5 pt-6 sm:px-9 sm:pb-7 sm:pt-9">
            <Skeleton className="h-2.5 w-32" />
            <Skeleton className="mt-5 h-9 w-4/5 sm:h-12" />
            <div className="mt-5 flex gap-1.5">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="mt-5 h-11 w-40 rounded-lg" />
          </header>

          <div className="border-t border-dashed border-[hsl(var(--material-paper-edge)/0.65)]">
            <section className="px-5 py-7 sm:px-9 sm:py-9">
              <div className="mb-5 flex items-baseline justify-between gap-4">
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-2.5 w-5" />
              </div>
              <ReadingLines />
              <div className="mt-6 rounded-xl border border-[hsl(var(--material-paper-edge)/0.6)] bg-black/[0.025] p-4 dark:bg-white/[0.025]">
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="mt-3 h-3 w-5/6" />
                <Skeleton className="mt-3 h-3 w-1/2" />
              </div>
            </section>

            <section className="border-t border-dashed border-[hsl(var(--material-paper-edge)/0.65)] px-5 py-7 sm:px-9 sm:py-9">
              <div className="mb-5 flex items-baseline justify-between gap-4">
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-2.5 w-5" />
              </div>
              <ReadingLines short />
            </section>
          </div>
        </article>
      </div>
    </main>
  );
}
