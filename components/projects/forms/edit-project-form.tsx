'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProjectForm } from '@/components/projects/forms/project-form';
import { useProjects } from '@/app/lib/hooks/useProjects';
import { useArtifacts } from '@/app/lib/hooks/useArtifacts';
import { useTags } from '@/app/lib/hooks/useTags';
import { useToastMessages } from '@/app/lib/hooks/useToastMessages';

export default function EditProjectForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { projects, updateProject, isLoading: isLoadingProjects, getAISuggestions } = useProjects();
  const { artifacts, isLoading: isLoadingArtifacts, error: artifactsError } = useArtifacts();
  const { tagNamesToTags } = useTags();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);

  const { showToast } = useToastMessages();

  const project = projects?.find(p => p.id === projectId);

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
      showToast('success', 'update', 'project');
      router.push('/dashboard/projects');
    } catch (error) {
      console.error('Failed to update project:', error);
      showToast('error', 'update', 'project');
      setIsSubmitting(false);
    }
  };

  const handleGetAISuggestions = async () => {
    const { tags } = await getAISuggestions(project.name, project.description || '');
    setSuggestedTags(tags);
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
    />
  );
}