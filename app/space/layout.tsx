import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/space/app-sidebar';
import { SpaceShellSkeleton } from '@/components/space/space-shell-skeleton';
import { ItemsProvider } from '../lib/contexts/item-context';
import { SearchCommand } from '@/components/space/search-command';
import { MonacoEditorPanel } from '@/components/space/monaco-editor-panel';
import { SpaceMobileActions } from '@/components/space/space-mobile-actions';
import { SpaceShortcutProvider } from '@/components/space/space-shortcut-provider';
import { loadInitialSpaceData } from './data';

export const metadata: Metadata = {
  title: 'Space · learning notes',
  description:
    'Public notes, code studies, exercises, and source-linked lessons.',
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
        <SpaceShortcutProvider>
          <div className="flex h-[100dvh] min-h-0 w-full min-w-0 overflow-hidden bg-background text-foreground">
            <SearchCommand />
            <AppSidebar />
            <div
              className="h-full min-h-0 min-w-0 flex-1 overflow-hidden pb-[var(--space-mobile-actions-offset,0px)] md:pb-0"
              data-space-background
            >
              {children}
            </div>
            <SpaceMobileActions />
            <MonacoEditorPanel />
          </div>
        </SpaceShortcutProvider>
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
