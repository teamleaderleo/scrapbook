import Footer from '@/components/dashboard/footer';
import ProjectContent from '@/components/projects/components/project-content';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Project | Stensibly',
};

export default function Page({ params }: { params: { id: string } }) {
  return (
    <main className="flex flex-col h-screen">
      <div className="flex-grow">
        {/* <Suspense fallback={<div>Loading project...</div>}> */}
          <ProjectContent projectId={params.id} />
        {/* </Suspense> */}
      </div>
      <Footer />
    </main>
  );
}