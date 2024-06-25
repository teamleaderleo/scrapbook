import { Card } from '@/app/ui/dashboard/cards';
import RevenueChart from '@/app/ui/dashboard/revenue-chart';
import LatestProjects from '@/app/ui/dashboard/latest-projects';
import { josefin_slab } from '@/app/ui/fonts';
import {fetchCardData } from '@/app/lib/data';
import { Suspense } from 'react';
import { RevenueChartSkeleton, LatestProjectsSkeleton, CardsSkeleton } from '@/app/ui/skeletons';
import CardWrapper from '@/app/ui/dashboard/cards';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
};
export default async function Page() {
  const { totalPaidProjects, totalPendingProjects, numberOfProjects, numberOfArtifacts } = await fetchCardData();
  return (
    <main>
      <h1 className={`${josefin_slab.className} mb-4 text-xl md:text-2xl`}>
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