import { Suspense } from 'react';
import Search from '@/components/ui/search';
import { ArtifactsTable } from '@/components/ui/artifacts/table';
import { CreateArtifact } from '@/components/ui/artifacts/button';
import { lusitana } from '@/components/ui/fonts';
import { ProjectsTableSkeleton } from '@/components/ui/skeletons';
import { Metadata } from 'next';
import { getCachedArtifacts } from '@/app/lib/cached-artifact-data';
import { ArtifactView } from '@/app/lib/definitions';
import { useArtifactStore } from '@/app/lib/store/artifactStore';

export const metadata: Metadata = {
  title: 'Artifacts',
};

export default async function Page({
  searchParams,
}: {
  searchParams?: { query?: string; page?: string };
}) {
  const initialArtifacts = await getCachedArtifacts();

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Artifacts</h1>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Search artifacts..." />
        <CreateArtifact />
      </div>
      <Suspense fallback={<ProjectsTableSkeleton />}>
        <ArtifactsTable initialArtifacts={initialArtifacts} />
      </Suspense>
    </div>
  );
}