import ProjectBlocks from '@/components/projects/components/project-blocks';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Project | Stensibly',
};

export default function Page({ params }: { params: { id: string } }) {
  return (
    <main className="flex flex-col h-[calc(100vh-112px)]"> {/* Adjust 112px based on your header and footer heights */}
      <Suspense fallback={<div className="flex-grow flex items-center justify-center">Loading project...</div>}>
        <ProjectBlocks projectId={params.id} />
      </Suspense>
    </main>
  );
}