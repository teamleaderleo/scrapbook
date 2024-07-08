import Link from 'next/link';
import Image from 'next/image';
import { lusitana } from '@/components/ui/fonts';
import Search from '@/components/ui/search';
import { ArtifactView, ArtifactType } from '@/app/lib/definitions';

const getArtifactThumbnail = (artifact: ArtifactView) => {
  const latestContent = artifact.contents[0];
  if (!latestContent) return '/placeholder-default.png';

  switch (latestContent.type) {
    case 'image':
      return latestContent.content;
    case 'text':
      return '/placeholder-text.png';
    case 'file':
      return '/placeholder-file.png';
    default:
      return '/placeholder-default.png';
  }
};

export default async function ArtifactsTable({
  artifacts,
}: {
  artifacts: ArtifactView[];
}) {
  return (
    <div className="w-full">
      <h1 className={`${lusitana.className} mb-8 text-xl md:text-2xl`}>
        Artifacts
      </h1>
      <Search placeholder="Search artifacts..." />
      <div className="mt-6 flow-root">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden rounded-md bg-gray-50 p-2 md:pt-0">
              {/* Mobile view remains unchanged */}
              <table className="hidden min-w-full rounded-md text-gray-900 md:table">
                <thead className="rounded-md bg-gray-50 text-left text-sm font-normal">
                  <tr>
                    <th scope="col" className="px-4 py-5 font-medium sm:pl-6">Name</th>
                    <th scope="col" className="px-3 py-5 font-medium">Type</th>
                    <th scope="col" className="px-3 py-5 font-medium">Description</th>
                    <th scope="col" className="px-3 py-5 font-medium">Tags</th>
                    <th scope="col" className="px-3 py-5 font-medium">Projects</th>
                    <th scope="col" className="px-3 py-5 font-medium">Updated</th>
                    <th scope="col" className="relative py-3 pl-6 pr-3">
                      <span className="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {artifacts.map((artifact) => (
                    <tr key={artifact.id} className="group bg-white border-b last:border-none">
                      <td className="whitespace-nowrap py-5 pl-4 pr-3 text-sm text-black group-first-of-type:rounded-tl-lg group-last-of-type:rounded-bl-lg sm:pl-6">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 relative overflow-hidden rounded-full">
                            <Image
                              src={getArtifactThumbnail(artifact)}
                              alt={`Thumbnail for ${artifact.name}`}
                              layout="fill"
                              objectFit="cover"
                            />
                          </div>
                          <div className="ml-4">
                            <p className="font-medium">{artifact.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-5 text-sm">
                        {artifact.type}
                      </td>
                      <td className="px-3 py-5 text-sm">
                        {artifact.description}
                      </td>
                      <td className="whitespace-nowrap px-3 py-5 text-sm">
                        {artifact.tags.length}
                      </td>
                      <td className="whitespace-nowrap px-3 py-5 text-sm">
                        {artifact.projects.length}
                      </td>
                      <td className="whitespace-nowrap px-3 py-5 text-sm">
                        {new Date(artifact.updated_at).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap py-5 pl-6 pr-3 text-sm group-first-of-type:rounded-tr-lg group-last-of-type:rounded-br-lg">
                        <div className="flex justify-end">
                          <Link
                            href={`/dashboard/artifacts/${artifact.id}/edit`}
                            className="text-blue-500 hover:text-blue-600"
                          >
                            Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}