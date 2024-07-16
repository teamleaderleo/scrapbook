import Form from '@/components/ui/artifacts/edit-artifact-form';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { fetchProjects } from '@/app/lib/data/data';
import { fetchSingleArtifact } from '@/app/lib/data/artifact-data';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { ADMIN_UUID } from '@/app/lib/constants';

export const metadata: Metadata = {
  title: 'Edit Artifact',
};

export default async function Page({ params }: { params: { id: string } }) {
  const id = params.id;
  const [artifact, projects] = await Promise.all([
    fetchSingleArtifact(ADMIN_UUID, id),
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
      <Form artifactId={artifact.id} projects={projects} />
    </main>
  );
}