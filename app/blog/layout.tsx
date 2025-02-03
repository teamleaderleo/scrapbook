import SiteNav from '@/components/site-nav';

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