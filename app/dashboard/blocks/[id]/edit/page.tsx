import { Metadata } from 'next';
import { Suspense } from 'react';
// import Breadcrumbs from '@/components/ui/components/breadcrumbs';
// import { BlockFormWrapper } from '@/components/blocks/forms/block-form-wrapper';

export const metadata: Metadata = {
  title: 'Edit Block',
};

export default function Page({ 
  params 
}: {
  params: Promise<any> | undefined;
}) {
  const getId = async () => {
    if (!params) return "";
    const resolvedParams = params instanceof Promise ? await params : params;
    return resolvedParams.id;
  };

  return (
    <main>
      {/* <Breadcrumbs
        breadcrumbs={[
          { label: 'Blocks', href: '/dashboard/blocks' },
          {
            label: 'Edit Block',
            href: `/dashboard/blocks/${getId()}/edit`,
            active: true,
          },
        ]}
      /> */}
      <Suspense fallback={<div>Loading form...</div>}>
        {/* <BlockFormWrapper blockId={getId()} /> */}
      </Suspense>
    </main>
  );
}