import React from 'react';
import Link from 'next/link';
import { ScrollArea } from "@/components/ui/components/scroll-area";
import { Separator } from "@/components/ui/components/separator";
import { BaseProject } from "@/app/lib/definitions/project-definitions";

export const ProjectList = ({ projects }: { projects: BaseProject[] }) => (
  <ScrollArea className="h-[calc(100vh-10rem)]"> {/* Adjusted for header, footer, and card header */}
    <div className="py-1">
      {projects.map((project, index) => (
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
  </ScrollArea>
);