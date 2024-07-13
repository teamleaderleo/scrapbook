import Form from '@/components/ui/projects/create-form';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { fetchAllArtifacts } from '@/app/lib/artifact-data';
import { Metadata } from 'next';
import { ADMIN_UUID } from '@/app/lib/constants';

export const metadata: Metadata = {
  title: 'Create',
};

export default async function Page() {
  const artifacts = await fetchAllArtifacts(ADMIN_UUID);
 
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
      <Form artifacts={artifacts} />
    </main>
  );
}