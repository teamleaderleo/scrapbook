'use client';

import React from 'react';
import { useProjects } from '@/app/lib/hooks/useProjects';
import { ProjectGrid } from '../projects/components/project-grid';

export const PortfolioView: React.FC = () => {
  const { 
    projects,
    isLoading,
    error,
  } = useProjects();

  if (isLoading) return <div className="text-center py-4">Loading...</div>;
  if (error) return <div className="text-center py-4 text-red-500">Error: {error.message}</div>;

  // Filter projects that have at least one artifact with an image
  const portfolioProjects = projects?.filter(project => 
    project.artifacts.some(artifact => 
      artifact.contents.some(content => content.type === 'image')
    )
  ) || [];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Portfolio</h1>
      <ProjectGrid projects={portfolioProjects} />
    </div>
  );
};