import { Metadata } from 'next';
import CreateProjectForm from '@/components/projects/forms/create-project-form';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Create Project',
};

export default function Page() {
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Projects', href: '/dashboard/projects' },
          {
            label: 'Create Project',
            href: '/dashboard/projects/create',
            active: true,
          },
        ]}
      />
      <Suspense fallback={<div>Loading form...</div>}>
        <CreateProjectForm />
      </Suspense>
    </main>
  );
}