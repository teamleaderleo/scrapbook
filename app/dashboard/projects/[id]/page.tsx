import { Metadata } from 'next';
import { Breadcrumb } from '@/components/ui/components/breadcrumb';
import { Suspense } from 'react';
import { getCachedProjects } from '@/app/lib/data/cached-project-data';
import Footer from '@/components/dashboard/footer';
import { ADMIN_UUID } from '@/app/lib/constants';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const projects = await getCachedProjects(ADMIN_UUID);
  const project = projects.find(p => p.id === params.id);
  return {
    title: project ? `Project: ${project.name}` : 'Project Not Found',
  };
}

export default async function Page({ params }: { params: { id: string } }) {
  const projects = await getCachedProjects(ADMIN_UUID);
  const project = projects.find(p => p.id === params.id);

  if (!project) {
    return <div>Project not found</div>;
  }

  return (
    <main className="flex flex-col h-screen">
      <div className="flex-grow">
        <Suspense fallback={<div>Loading project content...</div>}>
          <h1 className="text-2xl font-bold mt-4 mb-2">{project.name}</h1>
          <p>{project.description}</p>
        </Suspense>
      </div>
      <Footer projectName={project.name} />
    </main>
  );
}