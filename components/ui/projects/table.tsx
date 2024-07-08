import Link from 'next/link';
import Image from 'next/image';
import { fetchProjects } from '@/app/lib/data';
import { ADMIN_UUID } from '@/app/lib/constants';
import { ProjectView, ArtifactType } from '@/app/lib/definitions';

const getArtifactThumbnail = (artifact: { type: ArtifactType; content: string }) => {
  switch (artifact.type) {
    case 'image':
      return artifact.content;
    case 'text':
      return '/placeholder-text.png'; // Replace with actual text icon
    case 'file':
      return '/placeholder-file.png'; // Replace with actual file icon
    default:
      return '/placeholder-default.png'; // Replace with a default placeholder
  }
};

export default async function ProjectsTable({
  query,
  currentPage,
}: {
  query: string;
  currentPage: number;
}) {
  const projects = await fetchProjects(ADMIN_UUID, query, currentPage);

  return (
    <div className="mt-6 flow-root">
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden rounded-md bg-gray-50 p-2 md:pt-0">
            <div className="md:hidden">
              {projects?.map((project: ProjectView) => (
                <div
                  key={project.id}
                  className="mb-2 w-full rounded-md bg-white p-4"
                >
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <div className="mb-2 flex items-center">
                        <p className="text-sm font-medium">{project.name}</p>
                      </div>
                      <p className="text-sm text-gray-500">{project.description}</p>
                    </div>
                  </div>
                  <div className="flex w-full items-center justify-between pt-4">
                    <div>
                      <p className="text-sm font-medium">Status: {project.status}</p>
                      <p className="text-sm text-gray-500">Updated: {new Date(project.updated_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <p className="text-sm">Tags: {project.tags.length}</p>
                      <p className="text-sm">Artifacts: {project.artifacts.length}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    {project.artifacts.slice(0, 3).map((artifact) => (
                      <Image
                        key={artifact.id}
                        src={getArtifactThumbnail(artifact)}
                        alt={`Thumbnail for ${artifact.name}`}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ))}
                  </div>
                  <div className="mt-4">
                    <Link
                      href={`/dashboard/projects/${project.id}/edit`}
                      className="text-sm text-blue-500 hover:text-blue-600"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <table className="hidden min-w-full text-gray-900 md:table">
              <thead className="rounded-lg text-left text-sm font-normal">
                <tr>
                  <th scope="col" className="px-4 py-5 font-medium sm:pl-6">Name</th>
                  <th scope="col" className="px-3 py-5 font-medium">Description</th>
                  <th scope="col" className="px-3 py-5 font-medium">Status</th>
                  <th scope="col" className="px-3 py-5 font-medium">Tags</th>
                  <th scope="col" className="px-3 py-5 font-medium">Artifacts</th>
                  <th scope="col" className="px-3 py-5 font-medium">Updated</th>
                  <th scope="col" className="px-3 py-5 font-medium">Preview</th>
                  <th scope="col" className="relative py-3 pl-6 pr-3">
                    <span className="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {projects?.map((project: ProjectView) => (
                  <tr
                    key={project.id}
                    className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg"
                  >
                    <td className="whitespace-nowrap py-3 pl-6 pr-3">
                      <p>{project.name}</p>
                    </td>
                    <td className="px-3 py-3">
                      {project.description}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {project.status}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {project.tags.length}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {project.artifacts.length}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {new Date(project.updated_at).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <div className="flex space-x-2">
                        {project.artifacts.slice(0, 3).map((artifact) => (
                          <Image
                            key={artifact.id}
                            src={getArtifactThumbnail(artifact)}
                            alt={`Thumbnail for ${artifact.name}`}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ))}
                      </div>
                    </td>
                    <td className="whitespace-nowrap py-3 pl-6 pr-3">
                      <div className="flex justify-end">
                        <Link
                          href={`/dashboard/projects/${project.id}/edit`}
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
  );
}