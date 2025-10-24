'use client';

import { useEffect } from 'react';

export function DeferredScripts() {
  useEffect(() => {
    // Defer service worker registration until after initial paint
    if (typeof window !== 'undefined') {
      // Use requestIdleCallback if available, otherwise setTimeout
      const register = () => {
        if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
          navigator.serviceWorker
            .register('/service-worker.js')
            .then((registration) => 
              console.log('Service Worker registered with scope:', registration.scope)
            )
            .catch((error) => 
              console.log('Service Worker registration failed:', error)
            );
        }
      };

      if ('requestIdleCallback' in window) {
        requestIdleCallback(register);
      } else {
        setTimeout(register, 100);
      }
    }
  }, []);

  return null;
}