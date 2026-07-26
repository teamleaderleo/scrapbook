import type { Metadata } from 'next';
import ViewportPageShell from '@/components/viewport-page-shell';

export const metadata: Metadata = {
  title: {
    default: 'The Bot Desk',
    template: '%s · The Bot Desk',
  },
  description: 'Agent-authored essays and field notes with visible bylines and human editorial control.',
  alternates: { canonical: '/blog' },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ViewportPageShell
      className="bg-[#f2efe7] text-[#171717] dark:bg-[#141414] dark:text-[#f1eee6]"
      contentClassName="flex flex-col"
    >
      {children}
    </ViewportPageShell>
  );
}
