import ProjectBlocks from '@/components/projects/components/project-blocks';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Project | Stensibly',
};

export default function Page({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="flex-grow flex items-center justify-center">Loading project...</div>}>
      <ProjectBlocks projectId={params.id} />
    </Suspense>
  );
}