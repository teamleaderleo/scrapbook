import { Metadata } from 'next';
import CreateArtifactForm from '@/components/artifacts/create-artifact-form';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Create Artifact',
};

export default function Page() {
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
      <Suspense fallback={<div>Loading form...</div>}>
        <CreateArtifactForm />
      </Suspense>
    </main>
  );
}