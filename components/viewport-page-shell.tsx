import SiteNav from '@/components/site-nav';
import type { ReactNode } from 'react';

type ViewportPageShellProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  scroll?: 'page' | 'locked';
};

export default function ViewportPageShell({
  children,
  className = '',
  contentClassName = '',
  scroll = 'page',
}: ViewportPageShellProps) {
  if (scroll === 'locked') {
    return (
      <div
        className={`grid h-dvh min-w-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden ${className}`}
      >
        <SiteNav />
        <main className={`min-h-0 min-w-0 overflow-hidden ${contentClassName}`}>
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-dvh min-w-0 overflow-x-clip ${className}`}>
      <SiteNav />
      <main className={`min-w-0 ${contentClassName}`}>{children}</main>
    </div>
  );
}
