import Pagination from '@/components/ui/pagination';
import Search from '@/components/ui/search';
import ArtifactsTable from '@/components/ui/artifacts/table';
import { CreateArtifact } from '@/components/ui/artifacts/button';
import { lusitana } from '@/components/ui/fonts';
import { ArtifactsTableSkeleton } from '@/components/ui/skeletons';
import { Suspense } from 'react';
import { fetchArtifactsPages, fetchArtifacts } from '@/app/lib/data';
import { Metadata } from 'next';
import { ADMIN_UUID } from '@/app/lib/constants';

export const metadata: Metadata = {
  title: 'Artifacts',
};

export default async function Page({
  searchParams,
}: {
  searchParams?: {
    query?: string;
    page?: string;
  };
}) {
  const query = searchParams?.query || '';
  const currentPage = Number(searchParams?.page) || 1;

  const totalPages = await fetchArtifactsPages(ADMIN_UUID, query);
  const artifacts = await fetchArtifacts(ADMIN_UUID, query, currentPage);

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Artifacts</h1>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Search artifacts..." />
        <CreateArtifact />
      </div>
      <Suspense key={query + currentPage} fallback={<ArtifactsTableSkeleton />}>
        <ArtifactsTable initialArtifacts={artifacts} />
      </Suspense>
      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={totalPages} />
      </div>
    </div>
  );
}