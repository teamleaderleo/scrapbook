import SiteNav from '@/components/site-nav';
import UTCTimeVisualizer from '@/components/time-conversion-visualizer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Time machine',
  description:
    'Slide through the day and compare local time, UTC, Eastern, Pacific, and other time zones.',
};

export default function TimePage() {
  return (
    <main className="flex min-h-screen flex-col bg-sidebar-background">
      <SiteNav />
      <UTCTimeVisualizer />
    </main>
  );
}
