import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Search from '@/components/ui/search';
import { CreateProject } from '@/components/projects/button';
import { ProjectsTableSkeleton } from '@/components/ui/skeletons';
import { Metadata } from 'next';
import { ADMIN_UUID } from '@/app/lib/constants';

const ProjectsTable = dynamic(
  () => import('@/components/projects/table').then((mod) => mod.ProjectsTable),
  { ssr: false }
);

export const metadata: Metadata = {
  title: 'Projects',
};

export default function Page({
  searchParams,
}: {
  searchParams?: { query?: string; page?: string };
}) {
  return (
    <div className="w-full">
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Search projects..." />
        <CreateProject />
      </div>
      <Suspense fallback={<ProjectsTableSkeleton />}>
        <ProjectsTable accountId={ADMIN_UUID} />
      </Suspense>
    </div>
  );
}