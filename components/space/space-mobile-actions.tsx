'use client';

import { Code2, List, ListChecks, Plus, Search } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useItems } from '@/app/lib/contexts/item-context';
import { useSpaceShortcuts } from '@/components/space/space-shortcut-provider';

export function SpaceMobileActions() {
  const pathname = usePathname();
  const { editorOpen, isAdmin } = useItems();
  const { executeShortcut } = useSpaceShortcuts();

  const isList = pathname === '/space';
  const isReview = pathname === '/space/review';
  if (!isList && !isReview) return null;

  return (
    <nav
      data-space-mobile-actions
      aria-label="Space actions"
      aria-hidden={editorOpen}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(20,20,24,0.1)] backdrop-blur-md transition-opacity duration-150 motion-reduce:transition-none md:hidden ${
        editorOpen ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <div role="toolbar" aria-label="Space mobile actions" className="grid grid-cols-4 gap-1">
        <button
          type="button"
          onClick={() => executeShortcut('search.toggle')}
          className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
          aria-label="Search items"
        >
          <Search className="h-5 w-5" aria-hidden="true" />
          <span>Search</span>
        </button>

        <button
          type="button"
          onClick={() => executeShortcut('navigation.toggle-view')}
          className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
          aria-label={isReview ? 'Open item list' : 'Open review'}
        >
          {isReview ? (
            <List className="h-5 w-5" aria-hidden="true" />
          ) : (
            <ListChecks className="h-5 w-5" aria-hidden="true" />
          )}
          <span>{isReview ? 'List' : 'Review'}</span>
        </button>

        <button
          type="button"
          data-space-editor-trigger
          onClick={() => executeShortcut('editor.toggle')}
          className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
          aria-label="Open code editor"
          aria-pressed={editorOpen}
        >
          <Code2 className="h-5 w-5" aria-hidden="true" />
          <span>Editor</span>
        </button>

        <button
          type="button"
          onClick={() => executeShortcut('navigation.add')}
          disabled={!isAdmin}
          className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none"
          aria-label={isAdmin ? 'Add item' : 'Add item unavailable'}
          title={isAdmin ? 'Add item' : 'Admin access is required'}
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
          <span>Add</span>
        </button>
      </div>
    </nav>
  );
}
