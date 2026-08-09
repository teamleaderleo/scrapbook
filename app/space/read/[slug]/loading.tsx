import { Skeleton } from '@/components/ui/skeleton';

export default function ReadingSheetLoading() {
  return (
    <main className="min-h-screen bg-background px-3 py-3 sm:px-6 sm:py-6">
      <div className="mx-auto grid w-full max-w-6xl gap-4 lg:grid-cols-[13rem_minmax(0,46rem)] lg:justify-center lg:gap-8">
        <Skeleton className="h-11 w-36 rounded-full" />
        <div
          className="material-paper min-h-[70vh] rounded-2xl border p-6 sm:p-9"
          aria-label="Loading reading sheet"
          role="status"
        >
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-5 h-10 w-4/5" />
          <div className="mt-10 space-y-3">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-11/12" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      </div>
    </main>
  );
}
