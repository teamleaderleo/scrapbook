import { Metadata } from 'next';
import EditProjectForm from '@/components/ui/projects/edit-project-form';
import Breadcrumbs from '@/components/ui/breadcrumbs';

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
      <EditProjectForm projectId={params.id} />
    </main>
  );
}