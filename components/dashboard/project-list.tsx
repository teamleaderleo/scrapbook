'use client';

import React from 'react';
import Link from 'next/link';
import { useProjects } from '@/app/lib/hooks/useProjects';
import { ScrollArea } from "@/components/ui/components/scroll-area";
import { Separator } from "@/components/ui/components/separator";
import AcmeLogo from '../ui/assets/acme-logo';

export const ProjectList = () => {
  const { projects, isLoading } = useProjects();

  return (
    <div className="h-full text-white">
      <ScrollArea className="h-full px-3 py-4">
        <Link href="/" className="mb-4 flex items-center">
          {/* <AcmeLogo /> */}
        </Link>

        {isLoading ? (
          <p className="text-sm text-gray-400 px-3">Loading projects...</p>
        ) : (
          <div className="py-1">
            {projects?.map((project, index) => (
              <React.Fragment key={project.id}>
                <Link href={`/dashboard/projects/${project.id}/edit`}>
                  <div className="text-sm py-2 px-3 hover:bg-accent rounded transition-colors cursor-pointer">
                    # {project.name}
                  </div>
                </Link>
                {index < projects.length - 1 && <Separator className="my-1" />}
              </React.Fragment>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default ProjectList;