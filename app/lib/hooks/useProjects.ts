import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Fuse from 'fuse.js';
import { ProjectFetchOptions, ProjectFormSubmission } from '@/app/lib/definitions/definitions';
import { ProjectWithBlocks, ProjectPreview, BaseProject, ProjectWithExtendedBlocks, ProjectWithTags } from "../definitions/definitions";
import { createProject, updateProject, deleteProject } from '@/app/lib/actions/project-actions';
import { ADMIN_UUID } from '@/app/lib/constants';
// import { handleTagUpdate } from '@/app/lib/actions/tag-handlers';
import { getCachedProjects } from '../data/cached-project-data';
import { useKeyNav } from './useKeyNav';

const ITEMS_PER_PAGE = 6;

export function useProjects() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [fetchOptions, setFetchOptions] = useState<ProjectFetchOptions>({
    includeTags: true,
    includeBlocks: true,
  });

  // const { data: projectBasics, isLoading: isLoadingBasics } = useQuery<BaseProject[], Error>(
  //   ['projectBasics', ADMIN_UUID],
  //   () => getCachedProjectBasics(ADMIN_UUID),
  //   {
  //     staleTime: 5 * 60 * 1000,
  //   }
  // );

  const { data: projects, isLoading, error } = useQuery<ProjectWithBlocks[], Error>({
    queryKey: ['projects', ADMIN_UUID],
    queryFn: async () => {
      const fetchedProjects = await getCachedProjects(ADMIN_UUID);
      return fetchedProjects;
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });

  useEffect(() => {
    if (projects) {
      projects.forEach(project => queryClient.prefetchQuery({ queryKey: ['project', project.id] }));
    }
  }, [projects, queryClient]);

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

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProjectFormSubmission }) => updateProject(id, ADMIN_UUID, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => deleteProject(id, ADMIN_UUID),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const addProjectMutation = useMutation({
    mutationFn: (data: ProjectFormSubmission) => createProject(ADMIN_UUID, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const handleSearch = useCallback((newQuery: string) => {
    setQuery(newQuery);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  useKeyNav(currentPage, totalPages, handlePageChange, true);

  // const getAISuggestions = useCallback(async (name: string, description: string) => {
  //   const tags = await suggestTags(`${name} ${description}`);
  //   return { tags };
  // }, []);

  return {
    projects,
    // projectBasics,
    // isLoadingBasics,
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
    deleteProject: deleteProjectMutation.mutateAsync,
    addProject: addProjectMutation.mutateAsync,
    setFetchOptions,
    // getAISuggestions,
  };
}