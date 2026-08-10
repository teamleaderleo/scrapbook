import { OperatorConsole } from '@/components/operator/operator-console';
import ViewportPageShell from '@/components/viewport-page-shell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Operator · Leo',
  description: 'Copyable operator phrases for steering coding agents and other models.',
  alternates: { canonical: '/operator' },
};

export default function OperatorPage() {
  return (
    <ViewportPageShell
      className="bg-background text-foreground"
      contentClassName="min-h-[calc(100dvh-3rem)] text-inherit"
    >
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <OperatorConsole />
      </main>
    </ViewportPageShell>
  );
}
