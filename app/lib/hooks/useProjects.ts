import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, useQueries } from 'react-query';
import Fuse from 'fuse.js';
import { ProjectFetchOptions } from '@/app/lib/definitions/definitions';
import { ProjectWithArtifacts, ProjectPreview, BaseProject, ProjectWithExtendedArtifacts, ProjectWithTags } from "../definitions/definitions";
import { createProject, updateProject, deleteProject } from '@/app/lib/actions/project-actions';
import { ADMIN_UUID } from '@/app/lib/constants';
import { handleTagUpdate } from '@/app/lib/actions/tag-handlers';
import { suggestTags } from '../external/claude-utils';
import { getCachedProjectBasics, getCachedProjects } from '../data/cached-project-data';
import { handleProjectArtifactsUpdate } from '../actions/project-handlers';
import { useKeyNav } from './useKeyNav';

const ITEMS_PER_PAGE = 6;

export function useProjects() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [fetchOptions, setFetchOptions] = useState<ProjectFetchOptions>({
    includeTags: true,
    includeArtifacts: true,
    artifactDetail: 'withContents',
  });

  const { data: projectBasics, isLoading: isLoadingBasics } = useQuery<BaseProject[], Error>(
    ['projectBasics', ADMIN_UUID],
    () => getCachedProjectBasics(ADMIN_UUID),
    {
      staleTime: 5 * 60 * 1000,
    }
  );

  const { data: projects, isLoading, error } = useQuery<ProjectWithArtifacts[], Error>(
    ['projects', ADMIN_UUID],
    async () => {
      const fetchedProjects = await getCachedProjects(ADMIN_UUID);
      
      // Update artifact and tag caches
      // fetchedProjects.forEach((project: ProjectWithArtifacts) => {
      //   if (project.artifacts) {
      //     project.artifacts.forEach(artifact => {
      //       queryClient.setQueryData(['artifact', artifact.id], artifact);
      //     });
      //   }
      //   if (project.tags) {
      //     project.tags.forEach(tag => {
      //       queryClient.setQueryData(['tag', tag.id], tag);
      //     });
      //   }
      // });

      return fetchedProjects;
    },
    {
      staleTime: 5 * 60 * 1000,
      cacheTime: 1000 * 60 * 30, // 30 minutes
    }
  );

  const fuse = useMemo(() => {
    if (!projects) return null;
    return new Fuse(projects, {
      keys: ['name', 'description', 'tags.name'],
      threshold: 0.3,
    });
  }, [projects]);

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    if (!query) return projects;
    return fuse ? fuse.search(query).map(result => result.item) : projects;
  }, [projects, query, fuse]);

  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);

  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProjects.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProjects, currentPage]);

  const updateProjectMutation = useMutation(
    ({ id, formData }: { id: string; formData: FormData }) => updateProject(id, ADMIN_UUID, formData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['projects']);
      },
    }
  );

  const updateProjectArtifactsMutation = useMutation(
    ({ projectId, artifactIds }: { projectId: string; artifactIds: string[] }) =>
        handleProjectArtifactsUpdate(ADMIN_UUID, projectId, artifactIds),
    {
        onSuccess: () => {
        queryClient.invalidateQueries(['projects']);
        },
    }
    );

  const deleteProjectMutation = useMutation(
    (id: string) => deleteProject(id, ADMIN_UUID),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['projects']);
      },
    }
  );

  const addProjectMutation = useMutation(
    (formData: FormData) => createProject(ADMIN_UUID, formData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['projects']);
      },
    }
  );

  const updateProjectTagsMutation = useMutation(
    ({ projectId, tags }: { projectId: string; tags: string[] }) =>
      handleTagUpdate(ADMIN_UUID, projectId, 'project',tags),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['projects']);
      },
    }
  );

  const handleSearch = useCallback((newQuery: string) => {
    setQuery(newQuery);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  useKeyNav(currentPage, totalPages, handlePageChange, true);

  const getAISuggestions = useCallback(async (name: string, description: string) => {
    const tags = await suggestTags(`${name} ${description}`);
    return { tags };
  }, []);

  return {
    projects,
    projectBasics,
    isLoadingBasics,
    isLoading,
    filteredProjects,
    paginatedProjects,
    error,
    query,
    currentPage,
    totalPages,
    handleSearch,
    handlePageChange,
    updateProject: updateProjectMutation.mutateAsync,
    updateProjectArtifacts: updateProjectArtifactsMutation.mutateAsync,
    deleteProject: deleteProjectMutation.mutateAsync,
    addProject: addProjectMutation.mutateAsync,
    updateProjectTags: updateProjectTagsMutation.mutateAsync,
    setFetchOptions,
    getAISuggestions,
  };
}