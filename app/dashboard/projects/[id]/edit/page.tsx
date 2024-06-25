import Form from '@/app/ui/projects/edit-form';
import Breadcrumbs from '@/app/ui/projects/breadcrumbs';
import { fetchProjectById, fetchCustomers } from '@/app/lib/data';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Edit',
};

export default async function Page({ params }: { params: { id: string } }) {
  const id = params.id;
  const [project, customers] = await Promise.all([
    fetchProjectById(id),
    fetchCustomers(),
  ]);

  if (!project) {
    notFound();
  }
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Projects', href: '/dashboard/projects' },
          {
            label: 'Edit Project',
            href: `/dashboard/projects/${id}/edit`,
            active: true,
          },
        ]}
      />
      <Form project={project} customers={customers} />
    </main>
  );
}