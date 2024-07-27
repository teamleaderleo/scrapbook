import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Search from '@/components/ui/search';
import { CreateArtifact } from '@/components/artifacts/components/button';
import { ArtifactsTableSkeleton } from '@/components/ui/skeletons';
import { Metadata } from 'next';
import { ADMIN_UUID } from '@/app/lib/constants';

const ArtifactsTable = dynamic(
  () => import('@/components/artifacts/components/table').then((mod) => mod.ArtifactsTable),
  { ssr: false }
);

export const metadata: Metadata = {
  title: 'Artifacts',
};

export default async function Page({

}: {
}) {
  return (
    <div className="w-full">
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Suspense fallback={<div>Loading search...</div>}>
          <Search placeholder="Search artifacts..." />
        </Suspense>
        <CreateArtifact />
      </div>
      <Suspense fallback={<ArtifactsTableSkeleton />}>
        <ArtifactsTable accountId={ADMIN_UUID} />
      </Suspense>
    </div>
  );
}