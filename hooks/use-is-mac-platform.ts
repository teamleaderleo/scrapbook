'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};
const getServerSnapshot = () => false;
const getSnapshot = () => /Mac|iPhone|iPad/i.test(navigator.platform);

/**
 * Reports the platform modifier without changing the first hydrated render.
 * The server and hydration snapshots deliberately agree on Ctrl, then React
 * updates the hint after hydration when the browser is running on Apple gear.
 */
export function useIsMacPlatform() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
