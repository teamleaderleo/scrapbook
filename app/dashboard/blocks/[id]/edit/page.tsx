import { Metadata } from 'next';
import EditArtifactForm from '@/components/blocks/forms/edit-block-form';
import Breadcrumbs from '@/components/ui/components/breadcrumbs';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Edit Artifact',
};

export default function Page({ params }: { params: { id: string } }) {
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Artifacts', href: '/dashboard/blocks' },
          {
            label: 'Edit Artifact',
            href: `/dashboard/blocks/${params.id}/edit`,
            active: true,
          },
        ]}
      />
      <Suspense fallback={<div>Loading form...</div>}>
        <EditArtifactForm blockId={params.id} />
      </Suspense>
    </main>
  );
}