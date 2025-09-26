import { Metadata } from 'next';
import SiteNav from '@/components/site-nav';

export const metadata: Metadata = {
  title: 'Space',
  description: 'Spaced repetition learning system',
};

export default function SpaceLayout({
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