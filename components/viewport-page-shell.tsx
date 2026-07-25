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
  const overflowClass = scroll === 'locked' ? 'overflow-hidden' : 'overflow-y-auto overscroll-contain';

  return (
    <main
      className={`grid h-dvh grid-rows-[auto_minmax(0,1fr)] overflow-hidden ${className}`}
    >
      <SiteNav />
      <div className={`min-h-0 ${overflowClass} ${contentClassName}`}>{children}</div>
    </main>
  );
}
