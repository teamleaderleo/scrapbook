'use client';

import { useSearchParams } from 'next/navigation';

export function useBrowseQuery() {
  const params = useSearchParams();
  function update(key: string, value: string) {
    const url = new URL(window.location.href);
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
    window.history.replaceState(
      null,
      '',
      `${url.pathname}${url.search}${url.hash}`
    );
  }
  function clear() {
    const url = new URL(window.location.href);
    ['q', 'topic', 'kind'].forEach(key => url.searchParams.delete(key));
    window.history.replaceState(
      null,
      '',
      `${url.pathname}${url.search}${url.hash}`
    );
  }
  return {
    query: params.get('q') ?? '',
    topic: params.get('topic') ?? '',
    kind: params.get('kind') ?? '',
    update,
    clear,
  };
}

export const controlClass =
  'min-h-[44px] min-w-0 rounded-md border border-input bg-background px-3 text-sm';
