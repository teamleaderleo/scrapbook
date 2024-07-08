import { fetchArtifacts } from '@/app/lib/data';
import ArtifactsTable from '@/components/ui/artifacts/table';
import { Metadata } from 'next';
import { ADMIN_UUID } from '@/app/lib/constants';

export const metadata: Metadata = {
  title: 'Artifacts',
};

export default async function Page({
  searchParams,
}: {
  searchParams?: {
    query?: string;
    page?: string;
  };
}) {
  const query = searchParams?.query || '';

  const artifacts = await fetchArtifacts(ADMIN_UUID, query);

  return (
    <main>
      <ArtifactsTable artifacts={artifacts} />
    </main>
  );
}