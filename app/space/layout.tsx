import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/space/app-sidebar';
import { SpaceShellSkeleton } from '@/components/space/space-shell-skeleton';
import { ItemsProvider } from '../lib/contexts/item-context';
import { SearchCommand } from '@/components/space/search-command';
import { MonacoEditorPanel } from '@/components/space/monaco-editor-panel';
import { loadInitialSpaceData } from './data';

export const metadata: Metadata = {
  title: 'Space — a public learning garden',
  description:
    'Living notes, lesson plans, questions, code studies, and connections between things worth learning.',
  alternates: { canonical: '/space' },
  robots: { index: true, follow: true },
};

async function SpaceDataShell({ children }: { children: React.ReactNode }) {
  const { items, isAdmin, user, nowMs, hasMore, error } =
    await loadInitialSpaceData();

  return (
    <SidebarProvider>
      <ItemsProvider
        initialItems={items}
        initialIsAdmin={isAdmin}
        initialUser={user}
        initialNowMs={nowMs}
        initialHasMore={hasMore}
        initialError={error}
      >
        <div className="flex h-dvh min-h-0 w-full min-w-0 overflow-hidden bg-background text-foreground">
          <SearchCommand />
          <AppSidebar />
          <div className="h-full min-h-0 min-w-0 flex-1 overflow-hidden">
            {children}
          </div>
          <MonacoEditorPanel />
        </div>
      </ItemsProvider>
    </SidebarProvider>
  );
}

export default function SpaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<SpaceShellSkeleton />}>
      <SpaceDataShell>{children}</SpaceDataShell>
    </Suspense>
  );
}
