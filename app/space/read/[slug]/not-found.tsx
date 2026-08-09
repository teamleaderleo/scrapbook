import Link from 'next/link';

export default function ReadingSheetNotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 text-foreground">
      <section className="material-paper relative w-full max-w-lg overflow-hidden rounded-2xl border px-6 py-10 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] opacity-55">
          Space / missing sheet
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          This note is not on the shelf.
        </h1>
        <Link
          href="/space"
          className="mt-6 inline-flex min-h-[44px] items-center rounded-full border border-current/20 px-4 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5"
        >
          Return to Space
        </Link>
      </section>
    </main>
  );
}
