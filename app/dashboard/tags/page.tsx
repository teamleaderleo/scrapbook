import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { ADMIN_UUID } from '@/app/lib/constants';
import Search from '@/components/ui/components/search';
import { ArtifactsTableSkeleton } from '@/components/ui/components/skeletons';
import { Metadata } from 'next';

const TagManagementTable = dynamic(
  () => import('@/components/tags/table').then((mod) => mod.TagManagementTable),
  { ssr: false }
);

export const metadata: Metadata = {
  title: 'Tags',
};

export default async function TagsPage({
}: {
}) {
  return (
    <div className="w-full">
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Suspense fallback={<div>Loading search...</div>}>
          <Search placeholder="Search tags..." />
        </Suspense>
      </div>
      <Suspense fallback={<ArtifactsTableSkeleton />}>
        <TagManagementTable accountId={ADMIN_UUID} />
      </Suspense>
    </div>
  );
}