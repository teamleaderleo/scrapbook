import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import { SpaceViewClient } from "@/components/space/space-view";
import type { Item } from "@/app/lib/item-types";
import type { ReviewState } from "@/app/lib/review-types";

export const dynamic = 'force-dynamic';

async function getItemsWithReviews() {
  const supabase = await createClient();
  
  // Check if user is admin
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
    const { data: reviews } = await supabase
      .from('reviews')
      .select('*');
    
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

  return { items: mapped, isAdmin };
}

export default async function SpacePage() {
  const serverNow = Date.now();
  const { items, isAdmin } = await getItemsWithReviews();

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background p-4">
        <div className="text-muted-foreground">Loading…</div>
      </div>
    }>
      <SpaceViewClient 
        initialItems={items} 
        serverNow={serverNow}
        isAdmin={isAdmin}
      />
    </Suspense>
  );
}