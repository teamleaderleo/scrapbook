import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Search from '@/components/ui/components/search';
import { CreateBlock } from '@/components/blocks/components/button';
import { BlockTableSkeleton } from '@/components/ui/components/skeletons';
import { Metadata } from 'next';
import { ADMIN_UUID } from '@/app/lib/constants';

const BlockTable = dynamic(
  () => import('@/components/blocks/components/table').then((mod) => mod.BlockTable),
  { ssr: false }
);

export const metadata: Metadata = {
  title: 'Blocks',
};

export default async function Page({

}: {
}) {
  return (
    <div className="w-full">
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Suspense fallback={<div>Loading search...</div>}>
          <Search placeholder="Search blocks..." />
        </Suspense>
        <CreateBlock />
      </div>
      <Suspense fallback={<BlockTableSkeleton />}>
        <BlockTable accountId={ADMIN_UUID} />
      </Suspense>
    </div>
  );
}