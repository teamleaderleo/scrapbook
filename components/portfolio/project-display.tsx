import React from 'react';
import { ArtifactDisplay } from './artifact-display';
import { ArtifactWithRelations } from "@/app/lib/definitions/definitions";
import { ProjectWithArtifacts, ProjectWithExtendedArtifacts } from "@/app/lib/definitions/definitions";

export const ProjectDisplay: React.FC<{ project: ProjectWithArtifacts }> = ({ project }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{project.name}</h2>
      {project.description && <p className="text-gray-600">{project.description}</p>}
      <div className="flex items-center space-x-4">
        <span className={`px-2 py-1 rounded-full text-sm font-medium ${
          project.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {project.status}
        </span>
        <span className="text-sm text-gray-500">Updated: {new Date(project.updatedAt).toLocaleDateString()}</span>
      </div>
      {project.tags && project.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag: { id: React.Key | null | undefined; name: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | React.PromiseLikeOfReactNode | null | undefined; }) => (
            <span key={tag.id} className="bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700">
              {tag.name}
            </span>
          ))}
        </div>
      )}
      <div className="space-y-8">
        {project.artifacts.map((artifact: ArtifactWithRelations) => (
          <div key={artifact.id} className="border-t pt-6">
            <ArtifactDisplay artifact={artifact} />
          </div>
        ))}
      </div>
    </div>
  );
};