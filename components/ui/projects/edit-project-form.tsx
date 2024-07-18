'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tag } from '@/app/lib/definitions';
import { ProjectForm } from '@/components/ui/projects/project-form';
import { useProjects } from '@/app/lib/hooks/useProjects';
import { useArtifacts } from '@/app/lib/hooks/useArtifacts';
import { useTagStore } from '@/app/lib/store/tag-store';
import { ADMIN_UUID } from '@/app/lib/constants';

export default function EditProjectForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { projects, updateProject, isLoading: isLoadingProjects, getAISuggestions } = useProjects();
  const { artifacts, isLoading: isLoadingArtifacts, error: artifactsError } = useArtifacts();
  const { allTags, fetchAllTags, getOrCreateTags } = useTagStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);

  const project = projects?.find(p => p.id === projectId);

  useEffect(() => {
    fetchAllTags(ADMIN_UUID);
  }, [fetchAllTags]);

  useEffect(() => {
    if (!isLoadingProjects && !project) {
      router.replace('/dashboard/projects');
    }
  }, [project, projectId, router, isLoadingProjects]);

  if (isLoadingProjects || isLoadingArtifacts) {
    return <div>Loading...</div>;
  }

  if (artifactsError) {
    return <div>Error loading artifacts: {artifactsError.message}</div>;
  }

  if (!project) {
    return null;
  }

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      await updateProject({ id: projectId, formData });
      router.push('/dashboard/projects');
    } catch (error) {
      console.error('Failed to update project:', error);
      setIsSubmitting(false);
    }
  };

  const handleGetAISuggestions = async () => {
    const { tags } = await getAISuggestions(project.name, project.description || '');
    setSuggestedTags(tags);
  };

  const handleTagsChange = async (newTags: Tag[]) => {
    const tagNames = newTags.map(tag => tag.name);
    await getOrCreateTags(ADMIN_UUID, tagNames);
  };

  return (
    <ProjectForm
      project={project}
      artifacts={artifacts || []}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitButtonText="Update Project"
      cancelHref="/dashboard/projects"
      suggestedTags={suggestedTags}
      onGetAISuggestions={handleGetAISuggestions}
      allTags={allTags}
      onTagsChange={handleTagsChange}
    />
  );
}