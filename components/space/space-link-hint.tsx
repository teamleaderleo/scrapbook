'use client';

import { useLinkStatus } from 'next/link';

export function SpaceLinkHint() {
  const { pending } = useLinkStatus();

  return (
    <span
      aria-hidden="true"
      className={`h-1.5 w-1.5 shrink-0 rounded-full bg-current transition-opacity duration-150 ${
        pending ? 'animate-pulse opacity-40' : 'opacity-0'
      }`}
    />
  );
}
