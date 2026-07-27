import ViewportPageShell from '@/components/viewport-page-shell';
import UTCTimeVisualizer from '@/components/time-conversion-visualizer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Time machine',
  description:
    'Choose a local time and compare UTC, Eastern, Pacific, and other time zones.',
  alternates: { canonical: '/time' },
};

export default function TimePage() {
  return (
    <ViewportPageShell
      className="relative bg-background text-foreground"
      contentClassName="relative min-h-[calc(100dvh-3rem)] overflow-x-hidden text-inherit"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-30 dark:opacity-12"
        style={{
          backgroundImage:
            'linear-gradient(rgba(30,30,34,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(30,30,34,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <UTCTimeVisualizer />
    </ViewportPageShell>
  );
}
