'use client';

import React, { useEffect } from 'react';
import { useUIStore } from '@/app/lib/store/ui-store';
import { useProjects } from '@/app/lib/hooks/useProjects';

interface ProjectContentProps {
  projectId: string;
}

const ProjectContent: React.FC<ProjectContentProps> = ({ projectId }) => {
  const { projects, isLoading } = useProjects();
  const { currentProject, setCurrentProject } = useUIStore(state => ({
    currentProject: state.currentProject,
    setCurrentProject: state.setCurrentProject
  }));

  useEffect(() => {
    if (projects && (!currentProject || currentProject.id !== projectId)) {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        setCurrentProject(project);
      }
    }
  }, [projectId, projects, currentProject, setCurrentProject]);

  useEffect(() => {
    if (currentProject) {
      document.title = `${currentProject.name} | Stensibly`;
    }
  }, [currentProject]);


  if (isLoading) {
    return <div>Loading project...</div>;
  }

  if (!currentProject || currentProject.id !== projectId) {
    return <div>Project not found</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mt-4 mb-2">{currentProject.name}</h1>
      <p>{currentProject.description}</p>
      {/* Add more project content here */}
    </div>
  );
};

export default ProjectContent;