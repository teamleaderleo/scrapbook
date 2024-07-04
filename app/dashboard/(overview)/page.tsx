import { Card } from '@/components/ui/dashboard/cards';
import RevenueChart from '@/components/ui/dashboard/revenue-chart';
import LatestProjects from '@/components/ui/dashboard/latest-projects';
import { lusitana } from '@/components/ui/fonts';
import {fetchCardData } from '@/app/lib/data';
import { Suspense } from 'react';
import { RevenueChartSkeleton, LatestProjectsSkeleton, CardsSkeleton } from '@/components/ui/skeletons';
import CardWrapper from '@/components/ui/dashboard/cards';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
};
export default async function Page() {
  const {
    numberOfArtifacts,
    numberOfProjects,
    numberOfPendingProjects,
    numberOfCompletedProjects,
  } = await fetchCardData();
  return (
    <main>
      <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        Dashboard
      </h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Suspense fallback={<CardsSkeleton />}>
          <CardWrapper />
        </Suspense>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-8">
        <Suspense fallback={<RevenueChartSkeleton />}>
          <RevenueChart />
        </Suspense>
        <Suspense fallback={<LatestProjectsSkeleton />}>
          <LatestProjects />
        </Suspense>
      </div>
    </main>
  );
}