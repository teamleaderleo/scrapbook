import { Metadata } from 'next';
import EditArtifactForm from '@/components/artifacts/edit-artifact-form';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Edit Artifact',
};

export default function Page({ params }: { params: { id: string } }) {
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Artifacts', href: '/dashboard/artifacts' },
          {
            label: 'Edit Artifact',
            href: `/dashboard/artifacts/${params.id}/edit`,
            active: true,
          },
        ]}
      />
      <Suspense fallback={<div>Loading form...</div>}>
        <EditArtifactForm artifactId={params.id} />
      </Suspense>
    </main>
  );
}