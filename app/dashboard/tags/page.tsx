import { Suspense } from 'react';
import { fetchTags, fetchTagsPages } from '@/app/lib/data';
import { ADMIN_UUID } from '@/app/lib/constants';
import TagManagementTable from '@/components/ui/tags/table';
import Search from '@/components/ui/search';
import { lusitana } from '@/components/ui/fonts';
import { ProjectsTableSkeleton } from '@/components/ui/skeletons';
import Pagination from '@/components/ui/pagination';
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
  const query = searchParams?.query || '';
  const currentPage = Number(searchParams?.page) || 1;

  const totalPages = await fetchTagsPages(ADMIN_UUID, query);
  const tags = await fetchTags(ADMIN_UUID, query, currentPage);

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Tags</h1>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Search tags..." />
      </div>
      <Suspense key={query + currentPage} fallback={<ProjectsTableSkeleton />}>
        <TagManagementTable initialTags={tags} />
      </Suspense>
      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={totalPages} />
      </div>
    </div>
  );
}