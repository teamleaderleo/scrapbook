import { Suspense } from 'react';
import ViewportPageShell from '@/components/viewport-page-shell';
import UTCTimeVisualizer from '@/components/time-conversion-visualizer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Time machine',
  description:
    'Slide through the day and compare local time, UTC, Eastern, Pacific, and other time zones.',
  alternates: { canonical: '/time' },
};

function TimeFallback() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="w-full max-w-2xl px-4">
        <h1 className="text-3xl font-bold">Time Zone Converter</h1>
        <p className="mt-2 text-sm text-muted-foreground">Loading…</p>
      </div>
    </div>
  );
}

export default function TimePage() {
  return (
    <ViewportPageShell
      scroll="locked"
      className="bg-sidebar-background"
      contentClassName="flex min-h-0"
    >
      <Suspense fallback={<TimeFallback />}>
        <UTCTimeVisualizer />
      </Suspense>
    </ViewportPageShell>
  );
}
