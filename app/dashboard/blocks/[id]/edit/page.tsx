import { Metadata } from 'next';
// import Breadcrumbs from '@/components/ui/components/breadcrumbs';
import { Suspense } from 'react';
// import { BlockFormWrapper } from '@/components/blocks/forms/block-form-wrapper';

export const metadata: Metadata = {
  title: 'Edit Block',
};

export default function Page({ params }: { params: { id: string } }) {
  return (
    <main>
      {/* <Breadcrumbs
        breadcrumbs={[
          { label: 'Blocks', href: '/dashboard/blocks' },
          {
            label: 'Edit Block',
            href: `/dashboard/blocks/${params.id}/edit`,
            active: true,
          },
        ]}
      /> */}
      <Suspense fallback={<div>Loading form...</div>}>
        {/* <BlockFormWrapper blockId={params.id} /> */}
      </Suspense>
    </main>
  );
}