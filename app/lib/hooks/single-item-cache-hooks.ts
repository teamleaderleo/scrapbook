import { useQueryClient } from 'react-query';
import { Tag } from '../definitions/definitions';
import { BlockWithRelations } from "../definitions/definitions";
import { ProjectWithBlocks } from "../definitions/definitions";

export function useSingleBlockFromCache(blockId: string): BlockWithRelations | undefined {
  const queryClient = useQueryClient();
  const blocks = queryClient.getQueryData<BlockWithRelations[]>(['blocks']);
  return blocks?.find(block => block.id === blockId);
}

export function useSingleProjectFromCache(projectId: string): ProjectWithBlocks | undefined {
  const queryClient = useQueryClient();
  const projects = queryClient.getQueryData<ProjectWithBlocks[]>(['projects']);
  return projects?.find(project => project.id === projectId);
}

export function useSingleTagFromCache(tagId: string): Tag | undefined {
  const queryClient = useQueryClient();
  const tags = queryClient.getQueryData<Tag[]>(['tags']);
  return tags?.find(tag => tag.id === tagId);
}