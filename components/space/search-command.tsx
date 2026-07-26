'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { DialogTitle } from '@/components/ui/dialog';
import { useItems } from '@/app/lib/contexts/item-context';
import { parseQuery } from '@/app/lib/searchlang';
import { searchItems } from '@/app/lib/item-search';
import type { Item } from '@/app/lib/item-types';
import { Download, Plus, Search } from 'lucide-react';
import { startNavigationFeedback } from '@/components/navigation-feedback';
import { useSpaceShortcuts } from '@/components/space/space-shortcut-provider';

function filterItems(allItems: Item[], search: string, nowMs: number): Item[] {
  if (!search) return allItems.slice(0, 50);

  const searchLower = search.toLowerCase();
  if (search.includes(':')) {
    const query = parseQuery(search);
    return searchItems(allItems, query, nowMs).slice(0, 50);
  }

  const terms = searchLower.split(/\s+/).filter((term) => term.length > 0);
  return allItems
    .filter((item) =>
      terms.every((term) => {
        if (item.title.toLowerCase().includes(term)) return true;
        if (item.category.toLowerCase().includes(term)) return true;

        const tagValues = item.tags
          .map((tag) => (tag.includes(':') ? tag.split(':')[1] : tag))
          .join(' ')
          .toLowerCase();
        return tagValues.includes(term);
      }),
    )
    .slice(0, 50);
}

export function SearchCommand() {
  const [search, setSearch] = useState('');
  const { searchOpen: open, setSearchOpen: setOpen } = useSpaceShortcuts();
  const router = useRouter();
  const { items, isAdmin, hasMore, loadMore, loadingMore } = useItems();
  const [nowMs] = useState(() => Date.now());

  const filteredItems = filterItems(items, search, nowMs);

  const handleSelect = (item: Item) => {
    const href = `/space/review?item=${item.id}`;
    setOpen(false);
    setSearch('');
    startNavigationFeedback(href, 'review');
    router.push(href);
  };

  const handleSearchWithQuery = () => {
    if (!search) return;
    const href = `/space?tags=${encodeURIComponent(search)}`;
    setOpen(false);
    startNavigationFeedback(href, 'filtered list');
    router.push(href);
    setSearch('');
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
      <VisuallyHidden>
        <DialogTitle>Search Command</DialogTitle>
      </VisuallyHidden>
      <CommandInput
        placeholder="Search items... (e.g., 'difficulty:hard topic:dp' or 'leetcode')"
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No items found.</CommandEmpty>

        <CommandGroup heading={`Items (${filteredItems.length}${hasMore ? '+' : ''})`}>
          {filteredItems.map((item) => (
            <CommandItem key={item.id} onSelect={() => handleSelect(item)}>
              <div className="flex w-full flex-col">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{item.title}</span>
                  <span className="text-xs capitalize text-muted-foreground">{item.category}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {item.tags
                    .map((tag) => (tag.includes(':') ? tag.split(':')[1] : tag))
                    .join(', ')}
                </div>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>

        {hasMore && (
          <CommandGroup heading="More">
            <CommandItem disabled={loadingMore} onSelect={() => void loadMore()}>
              <span className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                {loadingMore ? 'Loading…' : 'Load more items'}
              </span>
            </CommandItem>
          </CommandGroup>
        )}

        {isAdmin && (
          <CommandGroup heading="Quick Actions">
            <CommandItem
              onSelect={() => {
                setOpen(false);
                startNavigationFeedback('/space/add', 'new item');
                router.push('/space/add');
              }}
            >
              <span className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add new item
              </span>
            </CommandItem>
          </CommandGroup>
        )}

        {search && (
          <CommandGroup heading="Search">
            <CommandItem onSelect={handleSearchWithQuery}>
              <span className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Filter list: <span className="font-mono text-sm">{search}</span>
              </span>
            </CommandItem>
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
