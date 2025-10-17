"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { DialogTitle } from "@/components/ui/dialog";
import { useItems } from "@/app/lib/contexts/item-context";
import { parseQuery } from "@/app/lib/searchlang";
import { searchItems } from "@/app/lib/item-search";
import type { Item } from "@/app/lib/item-types";
import { Plus, Search } from "lucide-react";

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const sp = useSearchParams();
  const { items: allItems, isAdmin } = useItems();
  const nowMs = useMemo(() => Date.now(), []);

  // Ctrl+K to open
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Parse search and filter items
  const filteredItems = useMemo(() => {
    if (!search) return allItems.slice(0, 50); // Show first 50 if empty
    
    const searchLower = search.toLowerCase();
    
    // If search contains structured operators (key:value), use query parser
    if (search.includes(':')) {
      const query = parseQuery(search);
      const results = searchItems(allItems, query, nowMs);
      return results.slice(0, 50);
    }
    
    // Otherwise, full-text search across title, category, and tag values
    // Split by spaces for multi-term AND search
    const terms = searchLower.split(/\s+/).filter(t => t.length > 0);
    
    const results = allItems.filter(item => {
      // Check if ALL terms match somewhere in the item
      return terms.every(term => {
        // Search in title
        if (item.title.toLowerCase().includes(term)) {
          return true;
        }
        
        // Search in category
        if (item.category.toLowerCase().includes(term)) {
          return true;
        }
        
        // Search in tag values (the part after the colon)
        const tagValues = item.tags
          .map(tag => tag.includes(':') ? tag.split(':')[1] : tag)
          .join(' ')
          .toLowerCase();
        
        if (tagValues.includes(term)) {
          return true;
        }
        
        return false;
      });
    });
    
    return results.slice(0, 50);
  }, [search, allItems, nowMs]);

  const handleSelect = (item: Item) => {
    setOpen(false);
    setSearch("");
    router.push(`/space/review?item=${item.id}`);
  };

  const handleSearchWithQuery = () => {
    if (search) {
      setOpen(false);
      router.push(`/space?tags=${encodeURIComponent(search)}`);
      setSearch("");
    }
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
        
        <CommandGroup heading={`Items (${filteredItems.length})`}>
          {filteredItems.map((item) => (
            <CommandItem
              key={item.id}
              onSelect={() => handleSelect(item)}
            >
                <div className="flex flex-col w-full">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{item.title}</span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {item.category}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {item.tags
                    .map((t) => (t.includes(":") ? t.split(":")[1] : t))
                    .join(", ")}
                </div>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
        
        {isAdmin && (
          <CommandGroup heading="Quick Actions">
            <CommandItem onSelect={() => {
              setOpen(false);
              router.push('/space/add');
            }}>
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