import Form from '@/components/ui/projects/create-form';
import Breadcrumbs from '@/components/ui/projects/breadcrumbs';
import { fetchArtifacts } from '@/app/lib/data';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create',
};

export default async function Page() {
  const artifacts = await fetchArtifacts();
 
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