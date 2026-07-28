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
        'group relative block overflow-hidden rounded-2xl border border-border/65 bg-card p-4 text-card-foreground shadow-[0_8px_18px_rgb(45_39_30/0.08)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-[0_13px_25px_rgb(45_39_30/0.105)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transform-none dark:shadow-[0_8px_18px_rgb(0_0_0/0.22)] dark:hover:shadow-[0_14px_28px_rgb(0_0_0/0.3)]',
        className,
      )}
    >
      {children}
    </a>
  );
}
