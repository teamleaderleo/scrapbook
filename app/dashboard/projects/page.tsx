import Pagination from '@/components/ui/projects/pagination';
import Search from '@/components/ui/search';
import Table from '@/components/ui/projects/table';
import { CreateProject } from '@/components/ui/projects/button';
import { lusitana } from '@/components/ui/fonts';
import { ProjectsTableSkeleton } from '@/components/ui/skeletons';
import { Suspense } from 'react';
import { fetchProjectsPages } from '@/app/lib/data';
import { Metadata } from 'next';
import { ADMIN_UUID } from '@/app/lib/constants';
// import ADMIN_UUID from '@/app/lib/constants';


export const metadata: Metadata = {
  title: 'Projects',
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

  const totalPages = await fetchProjectsPages(ADMIN_UUID, query);

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Projects</h1>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Search projects..." />
        <CreateProject />
      </div>
       <Suspense key={query + currentPage} fallback={<ProjectsTableSkeleton />}>
        <Table query={query} currentPage={currentPage} />
      </Suspense>
      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={totalPages} />
      </div>
    </div>
  );
}