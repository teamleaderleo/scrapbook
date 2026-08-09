export default function ReadingSheetLoading() {
  return (
    <main className="min-h-screen bg-background px-3 py-3 sm:px-6 sm:py-6">
      <div className="mx-auto grid w-full max-w-6xl gap-4 lg:grid-cols-[13rem_minmax(0,46rem)] lg:justify-center lg:gap-8">
        <div className="h-11 w-36 animate-pulse rounded-full bg-muted" />
        <div className="material-paper min-h-[70vh] animate-pulse rounded-2xl border p-6 sm:p-9">
          <div className="h-3 w-28 rounded bg-current/10" />
          <div className="mt-5 h-10 w-4/5 rounded bg-current/10" />
          <div className="mt-10 space-y-3">
            <div className="h-3 w-full rounded bg-current/10" />
            <div className="h-3 w-11/12 rounded bg-current/10" />
            <div className="h-3 w-4/5 rounded bg-current/10" />
          </div>
        </div>
      </div>
    </main>
  );
}
