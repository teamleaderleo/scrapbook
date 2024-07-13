import Form from '@/components/ui/artifacts/create-artifact-form';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { fetchProjects } from '@/app/lib/data/data';
import { Metadata } from 'next';
import { ADMIN_UUID } from '@/app/lib/constants';

export const metadata: Metadata = {
  title: 'Create Artifact',
};

export default async function Page() {
  const projects = await fetchProjects(ADMIN_UUID);
 
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Artifacts', href: '/dashboard/artifacts' },
          {
            label: 'Create Artifact',
            href: '/dashboard/artifacts/create',
            active: true,
          },
        ]}
      />
      <Form projects={projects} />
    </main>
  );
}