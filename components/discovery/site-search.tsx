'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { CensorReveal } from '@/components/ui/censor-reveal';
import { searchDiscovery, type DiscoveryItem } from '@/lib/discovery';
import { loadDiscoveryIndex, RecentItems } from './recent-items';

const OPEN_SEARCH_EVENT = 'scrapbook:open-search';
export function openSiteSearch() {
  window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
}

export function SiteSearchTrigger() {
  return (
    <button
      type="button"
      aria-label="Search Scrapbook"
      title="Search Scrapbook (⌘/Ctrl K)"
      onClick={openSiteSearch}
      className="inline-flex h-12 w-11 items-center justify-center border-l border-border/50 hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2"
    >
      <Search className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

export function SiteSearch() {
  const pathname = usePathname();
  const opener = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('');
  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    void loadDiscoveryIndex()
      .then(setItems)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    const show = () => {
      opener.current = document.activeElement as HTMLElement | null;
      load();
      setOpen(true);
    };
    const keydown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.isComposing ||
        event.altKey ||
        !(event.metaKey || event.ctrlKey) ||
        event.key.toLowerCase() !== 'k'
      )
        return;
      // Space keeps its existing local command search; Shift opens the whole site.
      if (pathname.startsWith('/space') && !event.shiftKey) return;
      event.preventDefault();
      if (!open) {
        opener.current = document.activeElement as HTMLElement | null;
        load();
      }
      setOpen(value => !value);
    };
    window.addEventListener(OPEN_SEARCH_EVENT, show);
    window.addEventListener('keydown', keydown);
    return () => {
      window.removeEventListener(OPEN_SEARCH_EVENT, show);
      window.removeEventListener('keydown', keydown);
    };
  }, [pathname, open, load]);
  const results = searchDiscovery(items, query, kind);
  const visible =
    query.trim() || kind
      ? results.slice(0, 40)
      : items.filter(item => item.kind === 'Page');
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="max-h-[85dvh] w-[calc(100%-1.5rem)] max-w-2xl gap-3 overflow-hidden p-4 sm:p-6"
        aria-describedby={undefined}
        onCloseAutoFocus={event => {
          event.preventDefault();
          if (opener.current?.isConnected) opener.current.focus();
        }}
      >
        <DialogTitle>Search Scrapbook</DialogTitle>
        <input
          autoFocus
          type="search"
          aria-label="Search Scrapbook"
          placeholder="Find writing, concepts, projects…"
          value={query}
          onChange={event => setQuery(event.target.value)}
          className="min-h-[44px] w-full rounded-md border border-input bg-background px-3 text-base"
        />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <label className="sr-only" htmlFor="site-search-kind">
            Collection
          </label>
          <select
            id="site-search-kind"
            value={kind}
            onChange={event => setKind(event.target.value)}
            className="min-h-[44px] max-w-full rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">Everything</option>
            {['Workbench', 'Knowledge', 'Study', 'Project', 'Page'].map(
              value => (
                <option key={value}>{value}</option>
              )
            )}
          </select>
          <span role="status" className="text-xs text-muted-foreground">
            {loading
              ? 'Loading…'
              : error
                ? 'Search unavailable'
                : query.trim() || kind
                  ? `${results.length} results${results.length > 40 ? ' · first 40 shown' : ''}`
                  : ''}
          </span>
          {error && (
            <button className="min-h-[44px] text-sm underline" onClick={load}>
              Retry
            </button>
          )}
        </div>
        <div
          className="min-h-0 overflow-y-auto overscroll-contain"
          onClick={event => {
            if ((event.target as HTMLElement).closest('a')) setOpen(false);
          }}
        >
          {!query.trim() && !kind && <RecentItems items={items} />}
          <ul className="divide-y divide-border">
            {visible.map(item => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  prefetch={false}
                  className="block rounded-sm px-1 py-3 hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2"
                >
                  <span className="mb-1 block text-xs text-muted-foreground">
                    {item.kind}
                  </span>
                  <span className="block text-sm font-medium">
                    <CensorReveal text={item.title} />
                  </span>
                  {query.trim() && (
                    <span
                      className="mt-1 overflow-hidden text-xs leading-5 text-muted-foreground"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      <CensorReveal text={item.summary} />
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
          {!loading && !error && visible.length === 0 && (
            <p className="py-5 text-sm text-muted-foreground">
              No matches. Try fewer words or another collection.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
