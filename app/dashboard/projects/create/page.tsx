import Form from '@/app/ui/projects/create-form';
import Breadcrumbs from '@/app/ui/projects/breadcrumbs';
import { fetchCustomers } from '@/app/lib/data';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create',
};

export default async function Page() {
  const customers = await fetchCustomers();
 
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
      <Form customers={customers} />
    </main>
  );
}