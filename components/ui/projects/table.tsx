import Link from 'next/link';
import Image from 'next/image';
import { fetchProjects } from '@/app/lib/data';
import { ADMIN_UUID } from '@/app/lib/constants';
import { ProjectView, ArtifactType, ArtifactContent, Artifact } from '@/app/lib/definitions';

const getArtifactThumbnail = (artifact: Artifact) => {
  console.log('Artifact:', JSON.stringify(artifact, null, 2));
  
  if (!artifact) {
    console.log('Artifact is undefined');
    return '/placeholder-default.png';
  }

  if (!artifact.contents || artifact.contents.length === 0) {
    console.log('Artifact contents are undefined or empty');
    return '/placeholder-default.png';
  }

  switch (artifact.type) {
    case 'image':
      return artifact.contents[0].content || '/placeholder-default.png';
    case 'text':
      return '/placeholder-text.png';
    case 'file':
      return '/placeholder-file.png';
    default:
      return '/placeholder-default.png';
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
  console.log('Projects:', JSON.stringify(projects, null, 2));
  
  return (
    <div className="mt-6 flow-root">
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden rounded-md bg-gray-50 p-2 md:pt-0">
            {/* Mobile view remains unchanged */}
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
                      <p className="font-medium">{project.name}</p>
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
                          <div key={artifact.id} className="w-10 h-10 relative overflow-hidden rounded-full">
                            <Image
                              src={getArtifactThumbnail(artifact)}
                              alt={`Thumbnail for ${artifact.name}`}
                              layout="fill"
                              objectFit="cover"
                            />
                          </div>
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