'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tag } from '@/app/lib/definitions';
import { ProjectForm } from '@/components/ui/projects/project-form';
import { useProjects } from '@/app/lib/hooks/useProjects';
import { useArtifacts } from '@/app/lib/hooks/useArtifacts';
import { useTagStore } from '@/app/lib/store/tag-store';
import { ADMIN_UUID } from '@/app/lib/constants';

export default function CreateProjectForm() {
  const router = useRouter();
  const { addProject, getAISuggestions } = useProjects();
  const { artifacts, isLoading: isLoadingArtifacts, error: artifactsError } = useArtifacts();
  const { allTags, fetchAllTags, ensureTagsExist } = useTagStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);

  const defaultProject = {
    accountId: ADMIN_UUID,
    id: '',
    name: '',
    description: '',
    status: 'pending' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: [],
    artifacts: []
  };

  useEffect(() => {
    fetchAllTags(ADMIN_UUID);
  }, [fetchAllTags]);

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      await addProject(formData);
      router.push('/dashboard/projects');
    } catch (error) {
      console.error('Failed to create project:', error);
      setIsSubmitting(false);
    }
  };

  const handleGetAISuggestions = async () => {
    const name = (document.getElementById('name') as HTMLInputElement)?.value || '';
    const description = (document.getElementById('description') as HTMLTextAreaElement)?.value || '';
    
    const { tags } = await getAISuggestions(name, description);
    setSuggestedTags(tags);
  };

  const handleTagsChange = async (newTags: Tag[]) => {
    const tagNames = newTags.map(tag => tag.name);
    await ensureTagsExist(ADMIN_UUID, tagNames);
  };

  if (isLoadingArtifacts) return <div>Loading artifacts...</div>;
  if (artifactsError) return <div>Error loading artifacts: {artifactsError.message}</div>;

  return (
    <ProjectForm
      project={defaultProject}
      artifacts={artifacts || []}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitButtonText="Create Project"
      cancelHref="/dashboard/projects"
      suggestedTags={suggestedTags}
      onGetAISuggestions={handleGetAISuggestions}
      allTags={allTags}
      onTagsChange={handleTagsChange}
    />
  );
}