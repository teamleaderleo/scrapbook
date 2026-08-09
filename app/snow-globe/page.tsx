import { SnowGlobe } from '@/components/snow-globe/snow-globe';
import ViewportPageShell from '@/components/viewport-page-shell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Snow globe · Leo',
  description:
    'A dimensional winter reading room with an automatic turn and simulated snow.',
  alternates: { canonical: '/snow-globe' },
};

export default function SnowGlobePage() {
  return (
    <ViewportPageShell
      className="bg-background text-foreground"
      contentClassName="flex min-h-[calc(100dvh-3rem)] min-w-0 flex-col overflow-x-hidden"
    >
      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col px-3 py-3 sm:px-5 sm:py-5 lg:px-7">
        <h1 className="sr-only">Snow globe</h1>
        <SnowGlobe />
      </div>
    </ViewportPageShell>
  );
}
