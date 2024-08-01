'use client';

import React from 'react';
import { TagList } from '@/components/tags/taglist';
import { DeleteProject, UpdateProject } from '@/components/projects/components/button';
import { useProjects } from '@/app/lib/hooks/useProjects';
import { ErrorBoundaryWithToast } from '../../errors/error-boundary';
import { Block, ProjectWithBlocks, Tag } from "@/app/lib/definitions/definitions";
import { BlockThumbnail } from '../../blocks/components/block-thumbnail';
import { useToastMessages } from '@/app/lib/hooks/useToastMessages';
import { Suspense } from 'react';
import { SearchParamsHandler } from '../../search-params-handler';
import { ProjectsTableSkeleton } from '@/components/ui/components/skeletons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Pagination from '../../ui/components/pagination';

export function ProjectsTable({ accountId }: { accountId: string }) {
  const { 
    paginatedProjects,
    isLoading,
    error,
    updateProject,
    deleteProject,
    handleSearch,
    handlePageChange,
    currentPage,
    totalPages,
    // updateProjectTags,
  } = useProjects();

  const { showToast } = useToastMessages();

  const handleDeleteProject = async (id: string) => {
    try {
      await deleteProject(id);
      showToast('success', 'delete', 'project');
    } catch (error) {
      console.error('Failed to delete project:', error);
      showToast('error', 'delete', 'project');
    }
  };

  const handleTagsChange = async (projectId: string, newTags: Tag[]) => {
    // await updateProjectTags({ projectId, tags: newTags.map(tag => tag.id) });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'secondary';
      case 'pending':
        return 'default';
      default:
        return 'outline';
    }
  };

  if (isLoading) return <ProjectsTableSkeleton />;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="space-y-4">
      <Suspense fallback={null}>
        <SearchParamsHandler
          onSearchChange={handleSearch}
          onPageChange={handlePageChange}
        />
      </Suspense>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Blocks</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead>Preview</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedProjects.map((project: ProjectWithBlocks) => (
            <TableRow key={project.id}>
              <TableCell className="font-medium">{project.name}</TableCell>
              <TableCell>{project.description}</TableCell>
              <TableCell>
                <TagList
                  selectedTags={project.tags || []}
                  onTagsChange={(newTags) => handleTagsChange(project.id, newTags)}
                />
              </TableCell>
              <TableCell>{project.blocks?.length}</TableCell>
              <TableCell>{new Date(project.updatedAt).toLocaleDateString()}</TableCell>
              <TableCell>
                {project.blocks && project.blocks.length > 0 && (
                  <div className="w-10 h-10 relative overflow-hidden rounded-full">
                    {/* <ErrorBoundaryWithToast>
                      {project.blocks[0] && (
                        <BlockThumbnail
                          block={project.blocks[0] as Block}
                          size={40}
                          priority={true}
                          className="flex-shrink-0"
                        />
                      )}
                    </ErrorBoundaryWithToast> */}
                  </div>
                )}
              </TableCell>
              <TableCell className="text-right">
                <UpdateProject id={project.id} />
                <DeleteProject 
                  id={project.id} 
                  onDelete={() => handleDeleteProject(project.id)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex justify-center">
        <Pagination 
          totalPages={totalPages} 
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}