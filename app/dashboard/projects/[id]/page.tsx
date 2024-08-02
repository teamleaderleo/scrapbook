import { Metadata } from 'next';
import { Breadcrumb } from '@/components/ui/components/breadcrumb';
import { Suspense } from 'react';
import { getCachedProjects } from '@/app/lib/data/cached-project-data';
import Footer from '@/components/dashboard/footer';
import { ADMIN_UUID } from '@/app/lib/constants';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const projects = await getCachedProjects(ADMIN_UUID); // Assuming this function exists and returns all projects
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
        <Breadcrumb
          breadcrumbs={[
            { label: 'Projects', href: '/dashboard/projects' },
            {
              label: project.name,
              href: `/dashboard/projects/${params.id}`,
              active: true,
            },
          ]}
        />
        <Suspense fallback={<div>Loading project content...</div>}>
          {/* Project content goes here */}
          <h1 className="text-2xl font-bold mt-4 mb-2">{project.name}</h1>
          <p>{project.description}</p>
          {/* Add more project details or components here */}
        </Suspense>
      </div>
      <Footer projectName={project.name} />
    </main>
  );
}