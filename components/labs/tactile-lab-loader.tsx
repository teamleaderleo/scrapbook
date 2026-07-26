'use client';

import dynamic from 'next/dynamic';

const TactileLabSimulator = dynamic(
  () => import('./tactile-lab-simulator').then((module) => module.TactileLabSimulator),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex min-h-[28rem] items-center justify-center rounded-[1.4rem] border border-border/70 bg-card/80 p-6 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground"
        data-tactile-loading
      >
        Loading isolated simulation client…
      </div>
    ),
  },
);

export function TactileLabLoader() {
  return <TactileLabSimulator />;
}
