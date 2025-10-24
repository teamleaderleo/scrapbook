// import ProjectBlocksContainer from '@/components/projects/components/project-blocks-container';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Project | teamleaderleo',
};

export default async function Page({ 
  params 
}: {
  params: Promise<any> | undefined;
}) {
  let id = "";
  
  if (params) {
    const resolvedParams = params instanceof Promise ? await params : params;
    id = resolvedParams.id;
  }
  
  return (
    <Suspense fallback={<div className="flex-grow flex items-center justify-center">Loading project...</div>}>
      {/* <ProjectBlocksContainer projectId={id} /> */}
    </Suspense>
  );
}