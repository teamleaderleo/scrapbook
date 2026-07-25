import type { Metadata } from 'next';
import ViewportPageShell from '@/components/viewport-page-shell';

export const metadata: Metadata = {
  title: 'Blog',
  description: "teamleaderleo's blog",
  alternates: { canonical: '/blog' },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ViewportPageShell
      className="bg-background text-foreground"
      contentClassName="flex flex-col"
    >
      {children}
    </ViewportPageShell>
  );
}
