import Link from 'next/link';
import { lusitana } from '@/components/ui/fonts';
import Search from '@/components/ui/search';
import { ArtifactView } from '@/app/lib/definitions';

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
              <div className="md:hidden">
                {artifacts?.map((artifact) => (
                  <div
                    key={artifact.id}
                    className="mb-2 w-full rounded-md bg-white p-4"
                  >
                    <div className="flex items-center justify-between border-b pb-4">
                      <div>
                        <p className="font-medium">{artifact.name}</p>
                        <p className="text-sm text-gray-500">{artifact.type}</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm">{artifact.description}</p>
                    </div>
                    <div className="mt-4 flex justify-between">
                      <div>
                        <p className="text-sm">Tags: {artifact.tags.length}</p>
                        <p className="text-sm">Projects: {artifact.projects.length}</p>
                      </div>
                      <p className="text-sm text-gray-500">
                        Updated: {new Date(artifact.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="mt-4">
                      <Link
                        href={`/dashboard/artifacts/${artifact.id}/edit`}
                        className="text-sm text-blue-500 hover:text-blue-600"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
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
                <tbody className="divide-y divide-gray-200 text-gray-900">
                  {artifacts.map((artifact) => (
                    <tr key={artifact.id} className="group">
                      <td className="whitespace-nowrap py-5 pl-4 pr-3 text-sm text-black group-first-of-type:rounded-md group-last-of-type:rounded-md sm:pl-6">
                        {artifact.name}
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
                      <td className="whitespace-nowrap py-5 pl-6 pr-3 text-sm">
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