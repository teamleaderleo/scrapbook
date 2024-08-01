import { Metadata } from 'next';
import { ProjectFormWrapper } from '@/components/projects/forms/project-form-wrapper';
import Breadcrumbs from '@/components/ui/components/breadcrumbs';
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
        <ProjectFormWrapper />
      </Suspense>
    </main>
  );
}