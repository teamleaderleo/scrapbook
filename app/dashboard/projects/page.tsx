import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Search from '@/components/ui/search';
import { CreateProject } from '@/components/projects/components/button';
import { ProjectsTableSkeleton } from '@/components/ui/skeletons';
import { Metadata } from 'next';
import { ADMIN_UUID } from '@/app/lib/constants';

const ProjectsTable = dynamic(
  () => import('@/components/projects/components/table').then((mod) => mod.ProjectsTable),
  { ssr: false }
);

export const metadata: Metadata = {
  title: 'Projects',
};

export default function Page({
}: {
}) {
  return (
    <div className="w-full">
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Suspense fallback={<div>Loading search...</div>}>
          <Search placeholder="Search projects..." />
        </Suspense>
        <CreateProject />
      </div>
      <Suspense fallback={<ProjectsTableSkeleton />}>
        <ProjectsTable accountId={ADMIN_UUID} />
      </Suspense>
    </div>
  );
}