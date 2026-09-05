'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CensorReveal } from '@/components/ui/censor-reveal';
import {
  parseRecentPaths,
  RECENT_STORAGE_KEY,
  RECENT_CHANGE_EVENT,
  type DiscoveryItem,
} from '@/lib/discovery';

let indexRequest: Promise<DiscoveryItem[]> | undefined;
export function loadDiscoveryIndex() {
  if (!indexRequest) {
    indexRequest = fetch('/api/site-search', { signal: AbortSignal.timeout(10_000) })
      .then(response => {
        if (!response.ok) throw new Error('Search is unavailable');
        return response.json() as Promise<DiscoveryItem[]>;
      })
      .catch(error => {
        indexRequest = undefined;
        throw error;
      });
  }
  return indexRequest;
}

export function readRecentPaths() {
  try {
    return parseRecentPaths(localStorage.getItem(RECENT_STORAGE_KEY));
  } catch {
    return [];
  }
}

export function RememberVisit({ href }: { href: string }) {
  useEffect(() => {
    try {
      const paths = parseRecentPaths(
        JSON.stringify([href, ...readRecentPaths()])
      );
      localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(paths));
      window.dispatchEvent(new Event(RECENT_CHANGE_EVENT));
    } catch {
      /* Reading remains usable when storage is unavailable. */
    }
  }, [href]);
  return null;
}

export function RecentItems({ items }: { items?: readonly DiscoveryItem[] }) {
  const [paths, setPaths] = useState<string[]>([]);
  const [index, setIndex] = useState<readonly DiscoveryItem[]>(items ?? []);
  useEffect(() => {
    let active = true;
    const update = () => {
      const next = readRecentPaths();
      setPaths(next);
      if (!items && next.length)
        void loadDiscoveryIndex()
          .then(value => {
            if (active) setIndex(value);
          })
          .catch(() => {});
    };
    update();
    window.addEventListener(RECENT_CHANGE_EVENT, update);
    window.addEventListener('storage', update);
    return () => {
      active = false;
      window.removeEventListener(RECENT_CHANGE_EVENT, update);
      window.removeEventListener('storage', update);
    };
  }, [items]);
  const recent = paths
    .flatMap(path => {
      const item = (items ?? index).find(entry => entry.href === path);
      return item ? [item] : [];
    })
    .slice(0, 6);
  if (!recent.length) return null;
  return (
    <section aria-label="Recently opened" className="min-w-0">
      <div className="flex items-center justify-between gap-3 border-b border-border py-2">
        <h2 className="text-sm font-semibold">Recently opened</h2>
        <button
          type="button"
          className="min-h-[44px] text-xs text-muted-foreground underline underline-offset-4"
          onClick={() => {
            try {
              localStorage.removeItem(RECENT_STORAGE_KEY);
            } catch {
              /* Still clear this view. */
            }
            setPaths([]);
            window.dispatchEvent(new Event(RECENT_CHANGE_EVENT));
          }}
        >
          Clear history
        </button>
      </div>
      <ul className="divide-y divide-border/60">
        {recent.map(item => (
          <li key={item.href}>
            <Link
              href={item.href}
              prefetch={false}
              className="flex min-h-[44px] items-baseline justify-between gap-4 py-3 text-sm hover:underline"
            >
              <span className="min-w-0">
                <CensorReveal text={item.title} />
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {item.kind}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
