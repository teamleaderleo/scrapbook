import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/space/app-sidebar';
import { SpaceShellSkeleton } from '@/components/space/space-shell-skeleton';
import { ItemsProvider } from '../lib/contexts/item-context';
import { createClient } from '@/utils/supabase/server';
import { SearchCommand } from '@/components/space/search-command';
import { MonacoEditorPanel } from '@/components/space/monaco-editor-panel';
import { mapDatabaseItemsToItems } from '@/app/lib/utils/database';
import { isAdminUser } from '@/app/lib/auth/admin';
import { SPACE_ITEM_SELECT, SPACE_PAGE_SIZE } from '@/app/lib/space-data';
import type { DbItem, DbReview } from '@/app/lib/db/supabase';

export const metadata: Metadata = {
  title: 'Space',
  description: 'Searchable notes, references, code, and spaced-repetition reviews.',
  alternates: { canonical: '/space' },
};

const REVIEW_SELECT = [
  'item_id',
  'user_id',
  'updated_at',
  'due',
  'stability',
  'difficulty',
  'scheduled_days',
  'learning_steps',
  'reps',
  'lapses',
  'state',
  'last_review',
  'suspended',
].join(',');

async function getInitialData() {
  const supabase = await createClient();
  const nowMs = Date.now();

  const [authResult, itemsResult] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('items')
      .select(SPACE_ITEM_SELECT)
      .order('created_at', { ascending: false })
      .range(0, SPACE_PAGE_SIZE - 1),
  ]);

  const user = authResult.data.user;
  const isAdmin = isAdminUser(user);

  if (itemsResult.error) {
    console.error('Error loading items:', itemsResult.error);
    throw new Error('Space items could not be loaded');
  }

  const databaseItems = (itemsResult.data ?? []) as unknown as DbItem[];
  const itemIds = databaseItems.map((item) => item.id);

  let databaseReviews: DbReview[] = [];
  if (isAdmin && itemIds.length > 0) {
    const reviewsResult = await supabase
      .from('reviews')
      .select(REVIEW_SELECT)
      .in('item_id', itemIds);

    if (reviewsResult.error) {
      console.error('Error loading reviews:', reviewsResult.error);
    } else {
      databaseReviews = (reviewsResult.data ?? []) as unknown as DbReview[];
    }
  }

  return {
    items: mapDatabaseItemsToItems(databaseItems, databaseReviews),
    isAdmin,
    user,
    nowMs,
    hasMore: databaseItems.length === SPACE_PAGE_SIZE,
  };
}

async function SpaceDataShell({ children }: { children: React.ReactNode }) {
  const { items, isAdmin, user, nowMs, hasMore } = await getInitialData();

  return (
    <SidebarProvider>
      <ItemsProvider
        initialItems={items}
        initialIsAdmin={isAdmin}
        initialUser={user}
        initialNowMs={nowMs}
        initialHasMore={hasMore}
      >
        <div className="flex h-dvh min-h-0 w-full min-w-0 overflow-hidden bg-background text-foreground">
          <SearchCommand />
          <AppSidebar />
          <div className="h-full min-h-0 min-w-0 flex-1 overflow-hidden">{children}</div>
          <MonacoEditorPanel />
        </div>
      </ItemsProvider>
    </SidebarProvider>
  );
}

export default function SpaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<SpaceShellSkeleton />}>
      <SpaceDataShell>{children}</SpaceDataShell>
    </Suspense>
  );
}
