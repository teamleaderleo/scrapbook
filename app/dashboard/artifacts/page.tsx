import { fetchFilteredArtifacts } from '@/app/lib/data';
import ArtifactsTable from '@/components/ui/artifacts/table';
import { Metadata } from 'next';

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

  const artifacts = await fetchFilteredArtifacts(query);

  return (
    <main>
      <ArtifactsTable artifacts={artifacts} />
    </main>
  );
}