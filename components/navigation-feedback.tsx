'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

const IDLE_PREFETCH_ROUTES = ['/', '/time', '/gallery', '/blog', '/atelier'];

type PendingNavigation = {
  href: string;
  label: string;
};

function anchorFromTarget(target: EventTarget | null) {
  return target instanceof Element ? target.closest<HTMLAnchorElement>('a[href]') : null;
}

function internalDestination(anchor: HTMLAnchorElement) {
  if (anchor.target && anchor.target !== '_self') return null;
  if (anchor.hasAttribute('download')) return null;

  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return null;
  if (!['http:', 'https:'].includes(url.protocol)) return null;

  return `${url.pathname}${url.search}`;
}

function destinationLabel(href: string) {
  const path = href.split('?')[0];
  if (path === '/') return 'home';
  return path.split('/').filter(Boolean).at(-1)?.replaceAll('-', ' ') ?? 'page';
}

export function NavigationFeedback() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState<PendingNavigation | null>(null);
  const prefetched = useRef(new Set<string>());
  const routeKey = useMemo(() => `${pathname}?${searchParams.toString()}`, [pathname, searchParams]);

  useEffect(() => {
    setPending(null);
  }, [routeKey]);

  useEffect(() => {
    const prefetch = (href: string) => {
      if (prefetched.current.has(href)) return;
      prefetched.current.add(href);
      router.prefetch(href, {
        onInvalidate: () => prefetched.current.delete(href),
      });
    };

    const prefetchFromEvent = (event: Event) => {
      const anchor = anchorFromTarget(event.target);
      if (!anchor) return;
      const href = internalDestination(anchor);
      if (href) prefetch(href);
    };

    const startNavigation = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const anchor = anchorFromTarget(event.target);
      if (!anchor) return;
      const href = internalDestination(anchor);
      if (!href) return;

      const current = `${window.location.pathname}${window.location.search}`;
      if (href === current || anchor.hash) return;

      prefetch(href);
      setPending({ href, label: destinationLabel(href) });
    };

    const startHistoryNavigation = () => {
      setPending({
        href: `${window.location.pathname}${window.location.search}`,
        label: 'previous page',
      });
    };

    document.addEventListener('pointerover', prefetchFromEvent, true);
    document.addEventListener('focusin', prefetchFromEvent, true);
    document.addEventListener('pointerdown', prefetchFromEvent, true);
    document.addEventListener('click', startNavigation, true);
    window.addEventListener('popstate', startHistoryNavigation);

    const idlePrefetch = () => {
      for (const href of IDLE_PREFETCH_ROUTES) {
        if (href !== pathname) prefetch(href);
      }
    };

    const windowWithIdle = window as typeof window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const idleId = windowWithIdle.requestIdleCallback
      ? windowWithIdle.requestIdleCallback(idlePrefetch, { timeout: 1800 })
      : window.setTimeout(idlePrefetch, 900);

    return () => {
      document.removeEventListener('pointerover', prefetchFromEvent, true);
      document.removeEventListener('focusin', prefetchFromEvent, true);
      document.removeEventListener('pointerdown', prefetchFromEvent, true);
      document.removeEventListener('click', startNavigation, true);
      window.removeEventListener('popstate', startHistoryNavigation);
      if (windowWithIdle.cancelIdleCallback) windowWithIdle.cancelIdleCallback(idleId);
      else window.clearTimeout(idleId);
    };
  }, [pathname, router]);

  useEffect(() => {
    if (!pending) return;
    const timeout = window.setTimeout(() => setPending(null), 15_000);
    return () => window.clearTimeout(timeout);
  }, [pending]);

  if (!pending) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100]" role="status" aria-live="polite">
      <div className="h-0.5 overflow-hidden bg-black/10 dark:bg-white/10">
        <div className="navigation-progress h-full w-2/5 bg-[#6f6878] dark:bg-[#d0c8d7]" />
      </div>
      <div className="absolute right-3 top-3 flex items-center gap-2 rounded-lg border border-black/18 bg-[#f4f1ea] px-3 py-2 text-xs font-semibold text-[#242328] shadow-[0_10px_28px_rgba(20,20,24,0.16)] dark:border-white/16 dark:bg-[#18191d] dark:text-[#f0ece5] sm:right-4 sm:top-4">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current motion-reduce:animate-none" />
        <span>Opening {pending.label}</span>
      </div>
    </div>
  );
}
