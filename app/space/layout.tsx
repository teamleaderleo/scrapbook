import type { Metadata } from 'next';
import { Suspense } from 'react';
import type { User } from '@supabase/supabase-js';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/space/app-sidebar';
import { SpaceShellSkeleton } from '@/components/space/space-shell-skeleton';
import { ItemsProvider } from '../lib/contexts/item-context';
import { createClient } from '@/utils/supabase/server';
import { SearchCommand } from '@/components/space/search-command';
import { MonacoEditorPanel } from '@/components/space/monaco-editor-panel';
import { SpaceMobileActions } from '@/components/space/space-mobile-actions';
import { SpaceShortcutProvider } from '@/components/space/space-shortcut-provider';
import { mapDatabaseItemsToItems } from '@/app/lib/utils/database';
import { isAdminUser } from '@/app/lib/auth/admin';
import { SPACE_ITEM_SELECT, SPACE_PAGE_SIZE } from '@/app/lib/space-data';
import type { DbItem, DbReview } from '@/app/lib/db/supabase';
import type { Item } from '@/app/lib/item-types';

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

const E2E_NOW_MS = Date.parse('2026-07-27T00:00:00.000Z');
const E2E_ITEMS: Item[] = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    title: 'Shortcut Alpha',
    slug: 'shortcut-alpha',
    url: null,
    defaultIndex: 0,
    versions: [
      {
        label: 'notes',
        content: 'Alpha review content',
        contentHtml: '<p>Alpha review content</p>',
        code: 'print("alpha")',
        codeHtml: '<pre><code>print(&quot;alpha&quot;)</code></pre>',
      },
    ],
    tags: ['topic:shortcuts', 'type:test'],
    category: 'reference',
    createdAt: 1,
    updatedAt: 1,
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    title: 'Shortcut Beta',
    slug: 'shortcut-beta',
    url: null,
    defaultIndex: 0,
    versions: [
      {
        label: 'notes',
        content: 'Beta review content',
        contentHtml: '<p>Beta review content</p>',
        code: null,
        codeHtml: '',
      },
    ],
    tags: ['topic:shortcuts', 'type:test'],
    category: 'reference',
    createdAt: 2,
    updatedAt: 2,
  },
];

const E2E_USER = {
  id: '00000000-0000-4000-8000-000000000099',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'space-e2e@example.com',
  app_metadata: {},
  user_metadata: {},
  created_at: '2026-07-27T00:00:00.000Z',
} as User;

async function getInitialData() {
  if (process.env.SCRAPBOOK_E2E_SPACE_FIXTURE === '1') {
    return {
      items: E2E_ITEMS,
      isAdmin: true,
      user: E2E_USER,
      nowMs: E2E_NOW_MS,
      hasMore: false,
    };
  }

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
        <SpaceShortcutProvider>
          <div
            data-space-shell
            className="flex h-dvh min-h-0 w-full min-w-0 overflow-hidden bg-background text-foreground"
          >
            <div
              data-space-background
              className="flex h-full min-h-0 min-w-0 flex-1 overflow-hidden"
            >
              <SearchCommand />
              <AppSidebar />
              <div className="h-full min-h-0 min-w-0 flex-1 overflow-hidden">{children}</div>
              <SpaceMobileActions />
            </div>
            <MonacoEditorPanel />
          </div>
        </SpaceShortcutProvider>
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
