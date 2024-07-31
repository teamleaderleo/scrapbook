import { Metadata } from 'next';
import CreateBlockForm from '@/components/blocks/forms/create-block-form';
import Breadcrumbs from '@/components/ui/components/breadcrumbs';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Create Block',
};

export default function Page() {
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Blocks', href: '/dashboard/blocks' },
          {
            label: 'Create Block',
            href: '/dashboard/blocks/create',
            active: true,
          },
        ]}
      />
      <Suspense fallback={<div>Loading form...</div>}>
        <CreateBlockForm />
      </Suspense>
    </main>
  );
}