import React from 'react';
import { ProjectWithArtifacts } from "@/app/lib/definitions/project-definitions";
import { ProjectCard } from './project-card';

export const ProjectGrid: React.FC<{ projects: ProjectWithArtifacts[] }> = ({ projects }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-max">
      {projects.map(project => (
        <div key={project.id} className="break-inside-avoid">
          <ProjectCard project={project} />
        </div>
      ))}
    </div>
  );
};