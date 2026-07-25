import SiteNav from '@/components/site-nav';
import type { ReactNode } from 'react';

type ViewportPageShellProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export default function ViewportPageShell({
  children,
  className = '',
  contentClassName = '',
}: ViewportPageShellProps) {
  return (
    <main
      className={`grid h-dvh grid-rows-[auto_minmax(0,1fr)] overflow-hidden ${className}`}
    >
      <SiteNav />
      <div className={`min-h-0 overflow-hidden ${contentClassName}`}>{children}</div>
    </main>
  );
}
