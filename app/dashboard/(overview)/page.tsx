import { Suspense } from 'react';
import { lusitana } from '@/components/ui/fonts';
import { Metadata } from 'next';
import ChatArtifact from '@/components/ui/dashboard/chatartifact';
import InfiniteScrollProjectGallery from '@/components/ui/dashboard/infinitescrollprojects';
import { DashboardRecommendations } from '@/components/ui/dashboard/dashboardrecommendations';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default async function Page() {
  return (
    <>
      <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        Dashboard
      </h1>
      <InfiniteScrollProjectGallery />
      <Suspense fallback={<div>Loading recommendations...</div>}>
        <DashboardRecommendations />
      </Suspense>
      <ChatArtifact />
    </>
  );
}