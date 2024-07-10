import Form from '@/components/ui/artifacts/edit-artifact-form';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { fetchArtifact, fetchProjects } from '@/app/lib/data';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { ADMIN_UUID } from '@/app/lib/constants';

export const metadata: Metadata = {
  title: 'Edit Artifact',
};

export default async function Page({ params }: { params: { id: string } }) {
  const id = params.id;
  const [artifact, projects] = await Promise.all([
    fetchArtifact(ADMIN_UUID, id),
    fetchProjects(ADMIN_UUID),
  ]);

  if (!artifact) {
    notFound();
  }
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Artifacts', href: '/dashboard/artifacts' },
          {
            label: 'Edit Artifact',
            href: `/dashboard/artifacts/${id}/edit`,
            active: true,
          },
        ]}
      />
      <Form artifact={artifact} projects={projects} />
    </main>
  );
}