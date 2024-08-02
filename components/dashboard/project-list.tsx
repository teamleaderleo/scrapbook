'use client';

import React from 'react';
import Link from 'next/link';
import { useProjects } from '@/app/lib/hooks/useProjects';
import { ScrollArea } from "@/components/ui/components/scroll-area";
import { Separator } from "@/components/ui/components/separator";
import ViewSwitcher from './view-switcher';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/components/button";
import { User, Settings, LogOut } from 'lucide-react';
import { signOut } from '@/auth';

export const ProjectList = () => {
  const { projects, isLoading } = useProjects();

  return (
    <div className="flex flex-col h-full bg-[#2B2D31] text-[#B5BAC1] w-60">
      <div className="p-3">
        <ViewSwitcher />
      </div>
      <ScrollArea className="flex-grow px-3">
        <h2 className="font-semibold mb-2 px-3 text-[#B5BAC1]">Projects</h2>
        {isLoading ? (
          <p className="text-sm text-[#B5BAC1] px-3">Loading projects...</p>
        ) : (
          <div className="py-1">
            {projects?.map((project, index) => (
              <React.Fragment key={project.id}>
                <Link href={`/dashboard/projects/${project.id}/edit`}>
                  <div className="text-sm py-2 px-3 hover:bg-[#35373C] rounded transition-colors cursor-pointer">
                    # {project.name}
                  </div>
                </Link>
                {index < projects.length - 1 && <Separator className="my-1 bg-[#35373C]" />}
              </React.Fragment>
            ))}
          </div>
        )}
      </ScrollArea>
      <div className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start">
              <User className="mr-2 h-4 w-4" />
              User Profile
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            {/* <DropdownMenuItem onSelect={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem> */}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default ProjectList;