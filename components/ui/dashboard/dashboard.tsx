'use client';

import React, { useState, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useArtifacts } from '@/app/lib/hooks/useArtifacts';
import { useProjects } from '@/app/lib/hooks/useProjects';
import { ProjectList } from './project-list';
import { ArtifactGrid } from './artifact-grid';
import { QuickAccess } from './quick-access';

const Dashboard = () => {
  const { artifacts, isLoading: artifactsLoading, error: artifactsError } = useArtifacts();
  const { projects, isLoading: projectsLoading, error: projectsError } = useProjects();

  const [featuredArtifacts, setFeaturedArtifacts] = useState(artifacts?.slice(0, 12) || []);
  const [recentProjects, setRecentProjects] = useState(projects?.slice(0, 20) || []);

  useEffect(() => {
    if (artifacts) setFeaturedArtifacts(artifacts.slice(0, 12));
    if (projects) setRecentProjects(projects.slice(0, 20));
  }, [artifacts, projects]);

  if (artifactsLoading || projectsLoading) return <div>Loading...</div>;
  if (artifactsError || projectsError) return <div>Error loading dashboard data</div>;

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-64 bg-gray-100 border-r">
        <ProjectList projects={recentProjects} />
      </div>
      <div className="flex-1 flex flex-col">
        <ScrollArea className="flex-1">
          <ArtifactGrid artifacts={featuredArtifacts} />
        </ScrollArea>
        <QuickAccess />
      </div>
    </div>
  );
};

export default Dashboard;