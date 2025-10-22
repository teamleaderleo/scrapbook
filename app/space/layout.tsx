import { Metadata } from 'next';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from '@/components/app-sidebar';
import { ItemsProvider } from '../lib/contexts/item-context';
import { createClient } from '@/utils/supabase/server';
import type { Item } from '@/app/lib/item-types';
import type { ReviewState } from '@/app/lib/review-types';
import { SearchCommand } from '@/components/space/search-command';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

export const metadata: Metadata = {
  title: 'Space',
  description: 'Spaced repetition learning system',
};

// Configure marked for server
marked.setOptions({
  gfm: true,
  breaks: true,
});

async function getInitialData() {
  const supabase = await createClient();
  
  const nowMs = Date.now(); // Server timestamp
  
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
    return { items: [], isAdmin, user };
  }

  // Map reviews
  let reviewsMap = new Map<string, ReviewState>();
  if (reviewsResult.data) {
    reviewsMap = new Map(
      reviewsResult.data.map(r => [r.item_id, {
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

  // Map to Item format and parse markdown on server
  const mapped: Item[] = await Promise.all(
    (itemsResult.data || []).map(async (item) => {
      // Parse markdown to HTML on server
      const rawHtml = item.content ? await marked.parse(item.content) : '';
      const contentHtml = sanitizeHtml(rawHtml, {
        allowedTags: [
          'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
          'a', 'ul', 'ol', 'li', 'blockquote', 'h1', 'h2', 'h3', 
          'h4', 'h5', 'h6', 'table', 'thead', 'tbody', 'tr', 'th', 
          'td', 'img', 'hr', 'div', 'span'
        ],
        allowedAttributes: {
          'a': ['href', 'target', 'rel'],
          'img': ['src', 'alt', 'title'],
          '*': ['class']
        },
      });

      return {
        id: item.id,
        userId: item.user_id || undefined,
        title: item.title,
        slug: item.slug,
        url: item.url,
        content: item.content,
        contentHtml, // Pre-rendered HTML
        contentType: item.content_type as 'markdown' | 'html' | 'plaintext',
        code: item.code || null,
        tags: item.tags || [],
        category: item.category,
        createdAt: new Date(item.created_at).getTime(),
        updatedAt: new Date(item.updated_at).getTime(),
        score: item.score || undefined,
        review: reviewsMap.get(item.id),
      };
    })
  );

  return { items: mapped, isAdmin, user, nowMs };
}

export default async function SpaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { items, isAdmin, user, nowMs } = await getInitialData();
  
  return (
    <SidebarProvider>
      <ItemsProvider 
        initialItems={items} 
        initialIsAdmin={isAdmin} 
        initialUser={user}
        initialNowMs={nowMs}
      >
        <SearchCommand /> 
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