'use client';

import { useSyncExternalStore } from 'react';
import {
  parsePracticeHistory,
  PRACTICE_HISTORY_KEY,
  type PracticeResult,
} from '@/lib/practice-history';

const eventName = 'scrapbook:practice-history-changed';
let fallback: string | null = null;
let sessionOnly = false;
function read() {
  try {
    return sessionOnly
      ? fallback
      : window.localStorage.getItem(PRACTICE_HISTORY_KEY);
  } catch {
    return fallback;
  }
}
function subscribe(listener: () => void) {
  const storage = (event: StorageEvent) => {
    if (event.key === PRACTICE_HISTORY_KEY || event.key === null) listener();
  };
  window.addEventListener('storage', storage);
  window.addEventListener(eventName, listener);
  return () => {
    window.removeEventListener('storage', storage);
    window.removeEventListener(eventName, listener);
  };
}
function write(entries: PracticeResult[]) {
  fallback = JSON.stringify(entries.slice(0, 50));
  try {
    window.localStorage.setItem(PRACTICE_HISTORY_KEY, fallback);
    sessionOnly = false;
  } catch {
    sessionOnly = true;
  }
  window.dispatchEvent(new Event(eventName));
}
export function usePracticeHistory() {
  const raw = useSyncExternalStore(subscribe, read, () => null);
  return {
    results: parsePracticeHistory(raw),
    sessionOnly,
    add: (result: PracticeResult) =>
      write([result, ...parsePracticeHistory(read())]),
    clear: () => write([]),
  };
}
