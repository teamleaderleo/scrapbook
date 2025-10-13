import { Metadata } from 'next';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from '@/components/app-sidebar';
import { ItemsProvider } from '../lib/contexts/item-context';
import { createClient } from '@/utils/supabase/server';
import type { Item } from '@/app/lib/item-types';
import type { ReviewState } from '@/app/lib/review-types';

export const metadata: Metadata = {
  title: 'Space',
  description: 'Spaced repetition learning system',
};

async function getInitialData() {
  const supabase = await createClient();
  
  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser();
  
  const ADMIN_USER_IDS = [
    '7f041d78-8d8d-4d77-934d-6e839c2c7e39',
    '9c838f77-83a9-416e-9bd0-ef18e77424e4',
  ];
  const isAdmin = user ? ADMIN_USER_IDS.includes(user.id) : false;

  // Fetch items
  const { data: items, error: itemsError } = await supabase
    .from('items')
    .select('*')
    .order('created_at', { ascending: false });

  if (itemsError) {
    console.error('Error loading items:', itemsError);
    return { items: [], isAdmin };
  }

  // Fetch reviews if admin
  let reviewsMap = new Map<string, ReviewState>();
  if (isAdmin) {
    const { data: reviews } = await supabase.from('reviews').select('*');
    
    if (reviews) {
      reviewsMap = new Map(
        reviews.map(r => [r.item_id, {
          state: r.state,
          due: r.due,
          last_review: r.last_review,
          stability: r.stability,
          difficulty: r.difficulty,
          scheduled_days: r.scheduled_days,
          learning_steps: r.learning_steps,
          reps: r.reps,
          lapses: r.lapses,
          suspended: r.suspended,
        }])
      );
    }
  }

  // Map to Item format
  const mapped: Item[] = (items || []).map(item => ({
    id: item.id,
    userId: item.user_id || undefined,
    title: item.title,
    slug: item.slug,
    url: item.url,
    content: item.content,
    contentType: item.content_type as 'markdown' | 'html' | 'plaintext',
    code: item.code || null,
    tags: item.tags || [],
    category: item.category,
    createdAt: new Date(item.created_at).getTime(),
    updatedAt: new Date(item.updated_at).getTime(),
    score: item.score || undefined,
    review: reviewsMap.get(item.id),
  }));

  return { items: mapped, isAdmin, user };
}

export default async function SpaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { items, isAdmin, user } = await getInitialData();
  
  return (
    <SidebarProvider>
      <ItemsProvider initialItems={items} initialIsAdmin={isAdmin} initialUser={user}>
        <div className="min-h-screen bg-white flex w-full">
          <AppSidebar/>
          <div className="flex flex-col flex-1">
            {children}
          </div>
        </div>
      </ItemsProvider>
    </SidebarProvider>
  );
}