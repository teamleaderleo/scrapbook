'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Route failed to load', error);
  }, [error]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#ecebe6] p-4 text-[#17181b] dark:bg-[#101115] dark:text-[#eeeae3]">
      <section className="w-full max-w-md rounded-2xl border border-black/15 bg-[#f4f1ea] p-5 shadow-[0_18px_55px_rgba(20,20,24,0.16)] dark:border-white/15 dark:bg-[#18191d]">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-black/55 dark:text-white/55">
          Page unavailable
        </p>
        <h1 className="mt-2 text-xl font-bold">This page did not finish loading.</h1>
        <p className="mt-2 text-sm leading-relaxed text-black/65 dark:text-white/65">
          Your previous page is still in browser history. Retry the request or go straight back.
        </p>
        {error.digest ? (
          <p className="mt-3 font-mono text-[10px] text-black/45 dark:text-white/45">Reference {error.digest}</p>
        ) : null}
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border border-black/15 bg-[#242328] px-3 py-2 text-sm font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:border-white/15 dark:bg-[#eeeae3] dark:text-[#17181b]"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:border-white/15"
          >
            Go back
          </button>
        </div>
      </section>
    </main>
  );
}
