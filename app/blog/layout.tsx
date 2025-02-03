import { Metadata } from 'next';
import SiteNav from '@/components/site-nav';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'teamleaderleo\'s blog - thoughts on... life',
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white flex flex-col w-full">
      <SiteNav />
      {children}
    </div>
  );
}