import { Metadata } from 'next';
import { Suspense } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from '@/components/app-sidebar';
import { ItemsProvider } from '../lib/contexts/item-context';
import { createClient } from '@/utils/supabase/server';
import { SearchCommand } from '@/components/space/search-command';
import { MonacoEditorPanel } from '@/components/space/monaco-editor-panel';
import { mapDatabaseItemsToItems } from '@/app/lib/utils/database';

export const metadata: Metadata = {
  title: 'Space',
  description: 'Spaced repetition learning system',
};

async function getInitialData() {
  const supabase = await createClient();
  
  const nowMs = Date.now();
  
  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser();
  
  const ADMIN_USER_IDS = [
    '7f041d78-8d8d-4d77-934d-6e839c2c7e39',
    '9c838f77-83a9-416e-9bd0-ef18e77424e4',
  ];
  const isAdmin = user ? ADMIN_USER_IDS.includes(user.id) : false;

  // Fetch items and reviews IN PARALLEL
  const [itemsResult, reviewsResult] = await Promise.all([
    supabase.from('items').select('*').order('created_at', { ascending: false }),
    isAdmin ? supabase.from('reviews').select('*') : Promise.resolve({ data: null })
  ]);

  if (itemsResult.error) {
    console.error('Error loading items:', itemsResult.error);
    return { items: [], isAdmin, user, nowMs };
  }

  // Use shared mapping function
  const mapped = mapDatabaseItemsToItems(
    itemsResult.data || [], 
    reviewsResult.data || []
  );

  return { items: mapped, isAdmin, user, nowMs };
}

// Cached static shell
async function StaticShell({ children }: { children: React.ReactNode }) {
  "use cache";
  
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background text-foreground flex w-full">
        {children}
      </div>
    </SidebarProvider>
  );
}

// Dynamic data fetching + sidebar (needs ItemsProvider)
async function DynamicData({ children }: { children: React.ReactNode }) {
  const { items, isAdmin, user, nowMs } = await getInitialData();
  
  return (
    <ItemsProvider 
      initialItems={items} 
      initialIsAdmin={isAdmin} 
      initialUser={user}
      initialNowMs={nowMs}
    >
      <SearchCommand />
      <AppSidebar />
      <div className="flex flex-col flex-1">
        {children}
      </div>
      <MonacoEditorPanel />
    </ItemsProvider>
  );
}

export default async function SpaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <StaticShell>
      <Suspense
        fallback={
          <div className="min-h-[40vh] w-full bg-background">
            <div className="mx-auto max-w-4xl p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-6 w-2/5 rounded bg-muted" />
                <div className="h-4 w-full rounded bg-muted/70" />
                <div className="h-4 w-11/12 rounded bg-muted/70" />
                <div className="h-4 w-10/12 rounded bg-muted/70" />
                <div className="h-24 w-full rounded bg-muted/60" />
              </div>
            </div>
          </div>
        }
      >
        <DynamicData>{children}</DynamicData>
      </Suspense>

    </StaticShell>
  );
}