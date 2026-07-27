import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export function WindLiftCard({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(
        'group relative block overflow-hidden rounded-2xl border border-border/65 bg-card p-4 text-card-foreground shadow-[0_8px_18px_rgb(45_39_30/0.08)] transition-[border-color,box-shadow,background-color] duration-150 hover:border-border hover:bg-card/95 hover:shadow-[0_16px_32px_rgb(45_39_30/0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:shadow-[0_8px_18px_rgb(0_0_0/0.22)] dark:hover:shadow-[0_18px_36px_rgb(0_0_0/0.34)]',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_16%,rgb(255_255_255/0.24),transparent_36%)] opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 dark:bg-[radial-gradient(circle_at_82%_16%,rgb(255_255_255/0.08),transparent_36%)]"
      />
      <div className="relative">{children}</div>
    </a>
  );
}
