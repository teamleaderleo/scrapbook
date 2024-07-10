import { Suspense } from 'react';
import { getAllTags } from '@/app/lib/utils-server';
import { ADMIN_UUID } from '@/app/lib/constants';
import TagManagementTable from '@/components/ui/tags/table';
import Search from '@/components/ui/search';
import { lusitana } from '@/components/ui/fonts';
import { ProjectsTableSkeleton } from '@/components/ui/skeletons';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tags',
};

export default async function TagsPage({
  searchParams,
}: {
  searchParams?: {
    query?: string;
  };
}) {
  const query = searchParams?.query || '';
  const tags = await getAllTags(ADMIN_UUID);

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Tags</h1>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Search tags..." />
      </div>
      <Suspense fallback={<ProjectsTableSkeleton />}>
        <TagManagementTable initialTags={tags} />
      </Suspense>
    </div>
  );
}