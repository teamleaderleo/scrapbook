import { config } from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { parseMarkdown, highlightCode } from '../app/lib/markdown-utils.js';

// Load .env.local
config({ path: path.resolve(process.cwd(), '.env.local') });

async function backfillParsedHtml() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  // Get all items
  const { data: items, error } = await supabase
    .from('items')
    .select('*');
  
  if (error) {
    console.error('Error fetching items:', error);
    throw error;
  }
  
  console.log(`Backfilling ${items.length} items...`);
  
  // Parse and update each item
  for (const item of items) {
    console.log(`Processing item ${item.id}...`);
    
    const contentHtml = await parseMarkdown(item.content ?? '');
    const codeHtml = await highlightCode(item.code ?? null, 'python');
    
    const { error: updateError } = await supabase
      .from('items')
      .update({ 
        content_html: contentHtml,
        code_html: codeHtml 
      })
      .eq('id', item.id);
    
    if (updateError) {
      console.error(`✗ Failed to update item ${item.id}:`, updateError);
    } else {
      console.log(`✓ Backfilled item ${item.id}`);
    }
  }
  
  console.log('Done!');
}

backfillParsedHtml();