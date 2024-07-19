import { Metadata } from 'next';
import EditProjectForm from '@/components/projects/edit-project-form';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Edit Project',
};

export default function Page({ params }: { params: { id: string } }) {
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Projects', href: '/dashboard/projects' },
          {
            label: 'Edit Project',
            href: `/dashboard/projects/${params.id}/edit`,
            active: true,
          },
        ]}
      />
      <Suspense fallback={<div>Loading form...</div>}>
        <EditProjectForm projectId={params.id} />
      </Suspense>
    </main>
  );
}