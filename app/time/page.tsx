import ViewportPageShell from '@/components/viewport-page-shell';
import UTCTimeVisualizer from '@/components/time-conversion-visualizer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Time machine',
  description:
    'Slide through the day and compare local time, UTC, Eastern, Pacific, and other time zones.',
  alternates: { canonical: '/time' },
};

export default function TimePage() {
  return (
    <ViewportPageShell
      scroll="locked"
      className="bg-sidebar-background"
      contentClassName="flex min-h-0"
    >
      <UTCTimeVisualizer />
    </ViewportPageShell>
  );
}
