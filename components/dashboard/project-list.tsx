import React from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BaseProject } from '@/app/lib/definitions';

export const ProjectList = ({ projects }: { projects: BaseProject[] }) => (
  <ScrollArea className="h-[calc(100vh-4rem)]">
    <div className="space-y-1 p-2">
      {projects.map((project) => (
        <Link href={`/dashboard/projects/${project.id}`} key={project.id}>
          <Button variant="ghost" className="w-full justify-start">
            # {project.name}
          </Button>
        </Link>
      ))}
    </div>
  </ScrollArea>
);