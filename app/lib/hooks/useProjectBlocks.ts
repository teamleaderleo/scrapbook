import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProjectWithBlocks, BlockWithRelations } from "../definitions/definitions";
import { updateBlock, deleteBlock, createBlockInProject } from '@/app/lib/actions/block-actions';
import { ADMIN_UUID } from '@/app/lib/constants';
import { JSONContent } from '@tiptap/react';

const INITIAL_LOAD_COUNT = 20;
const LOAD_MORE_COUNT = 10;

export function useProjectBlocks(projectId: string, accountId: string = ADMIN_UUID) {
  const queryClient = useQueryClient();
  const [visibleBlocks, setVisibleBlocks] = useState(INITIAL_LOAD_COUNT);

  const { data: projects } = useQuery<ProjectWithBlocks[], Error>({
    queryKey: ['projects', accountId],
  });

  const project = useMemo(() => 
    projects?.find(p => p.id === projectId),
    [projects, projectId]
  );

  const blocks = useMemo(() => 
    project?.blocks || [],
    [project]
  );

  const paginatedBlocks = useMemo(() => 
    blocks.slice(0, visibleBlocks),
    [blocks, visibleBlocks]
  );

  const hasNextPage = blocks.length > visibleBlocks;

  const loadMore = useCallback(() => {
    setVisibleBlocks(prev => Math.min(prev + LOAD_MORE_COUNT, blocks.length));
  }, [blocks.length]);

  const updateBlockMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: JSONContent }) => 
      updateBlock(id, accountId, JSON.stringify(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', accountId] });
    },
  });

  const deleteBlockMutation = useMutation({
    mutationFn: (id: string) => deleteBlock(id, accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', accountId] });
    },
  });

  const createBlockMutation = useMutation({
    mutationFn: (data: JSONContent) => 
      createBlockInProject(accountId, projectId, JSON.stringify(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', accountId] });
    },
  });

  return {
    blocks: paginatedBlocks,
    isLoading: !projects,
    hasNextPage,
    loadMore,
    updateBlock: updateBlockMutation.mutate,
    deleteBlock: deleteBlockMutation.mutate,
    createBlock: createBlockMutation.mutate,
  };
}