import { Suspense } from 'react';
import { ADMIN_UUID } from '@/app/lib/constants';
import TagManagementTable from '@/components/tags/table';
import Search from '@/components/ui/search';
import { lusitana } from '@/components/ui/fonts';
import { ArtifactsTableSkeleton } from '@/components/ui/skeletons';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tags',
};

export default async function TagsPage({
  searchParams,
}: {
  searchParams?: {
    query?: string;
    page?: string;
  };
}) {
  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Tags</h1>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Search tags..." />
      </div>
      <Suspense fallback={<ArtifactsTableSkeleton />}>
        <TagManagementTable accountId={ADMIN_UUID} />
      </Suspense>
    </div>
  );
}