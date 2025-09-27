import { Metadata } from 'next';
import SiteNav from '@/components/site-nav';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from '@/components/app-sidebar';
import MinimalSiteNav from '@/components/minimal-site-nav';

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
    <SidebarProvider>
      <div className="min-h-screen bg-white flex w-full">
        {/* <SpaceSidebar /> */}
        <AppSidebar/>
        <div className="flex flex-col flex-1">
          {/* <MinimalSiteNav /> */}
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}