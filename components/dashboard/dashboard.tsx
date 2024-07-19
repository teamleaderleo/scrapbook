'use client';

import React, { useState, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useArtifacts } from '@/app/lib/hooks/useArtifacts';
import { useProjects } from '@/app/lib/hooks/useProjects';
import { ProjectList } from './project-list';
import { ArtifactGrid } from './artifact-grid';
import { QuickAccess } from './quick-access';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Grid, BarChart } from "lucide-react";

const Dashboard = () => {
  const { artifacts, isLoading: artifactsLoading, error: artifactsError } = useArtifacts();
  const { projects, isLoading: projectsLoading, error: projectsError } = useProjects();
  const [view, setView] = useState("artifacts");

  const [featuredArtifacts, setFeaturedArtifacts] = useState(artifacts?.slice(0, 12) || []);
  const [recentProjects, setRecentProjects] = useState(projects?.slice(0, 20) || []);

  useEffect(() => {
    if (artifacts) setFeaturedArtifacts(artifacts.slice(0, 12));
    if (projects) setRecentProjects(projects.slice(0, 20));
  }, [artifacts, projects]);

  if (artifactsLoading || projectsLoading) return <div>Loading...</div>;
  if (artifactsError || projectsError) return <div>Error loading dashboard data</div>;

  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden"> {/* Adjust for header and footer */}
      <Card className="w-64 mr-4 overflow-hidden">
        <CardHeader>
          <h2 className="text-lg font-semibold">Projects</h2>
        </CardHeader>
        <CardContent className="p-0">
          <ProjectList projects={recentProjects} />
        </CardContent>
      </Card>
      <div className="flex-1 overflow-hidden">
        <Card className="h-full flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <QuickAccess />
            <ToggleGroup type="single" value={view} onValueChange={(value: React.SetStateAction<string>) => value && setView(value)}>
              <ToggleGroupItem value="artifacts" aria-label="Show artifacts">
                <Grid className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="stats" aria-label="Show stats">
                <BarChart className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            {view === "artifacts" ? (
              <ScrollArea className="h-full">
                <ArtifactGrid artifacts={featuredArtifacts} />
              </ScrollArea>
            ) : (
              <ScrollArea className="h-full p-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Card>
                    <CardHeader>
                      <h3 className="text-sm font-medium">Total Projects</h3>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{projects?.length}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <h3 className="text-sm font-medium">Total Artifacts</h3>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{artifacts?.length}</p>
                    </CardContent>
                  </Card>
                  {/* Add more stat cards as needed */}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;