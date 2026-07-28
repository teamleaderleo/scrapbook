import { SnowGlobe } from '@/components/snow-globe/snow-globe';
import ViewportPageShell from '@/components/viewport-page-shell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Snow globe · Leo',
  description: 'A pocket snow globe driven by touch, device tilt, and motion.',
  alternates: { canonical: '/snow-globe' },
};

export default function SnowGlobePage() {
  return (
    <ViewportPageShell
      className="bg-background text-foreground"
      contentClassName="flex min-h-[calc(100dvh-3rem)] min-w-0 flex-col overflow-x-hidden"
    >
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        <header className="mb-4 max-w-2xl sm:mb-6">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Atlas experiment · motion toy
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Snow globe</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Tip the phone, drag the glass, or give it a shake. The snow keeps its own momentum.
          </p>
        </header>
        <SnowGlobe />
      </div>
    </ViewportPageShell>
  );
}
