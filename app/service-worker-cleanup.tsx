'use client';

import { useEffect } from 'react';

const LEGACY_CACHE_NAMES = ['image-cache-v1'];

export function ServiceWorkerCleanup() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    void navigator.serviceWorker.getRegistrations().then((registrations) =>
      Promise.all(registrations.map((registration) => registration.unregister())),
    );

    if ('caches' in window) {
      void Promise.all(LEGACY_CACHE_NAMES.map((name) => caches.delete(name)));
    }
  }, []);

  return null;
}
