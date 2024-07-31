'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProjectForm } from '@/components/projects/forms/project-form';
import { useProjects } from '@/app/lib/hooks/useProjects';
import { useBlocks } from '@/app/lib/hooks/useBlocks';
import { useTags } from '@/app/lib/hooks/useTags';
import { ADMIN_UUID } from '@/app/lib/constants';
import { useToastMessages } from '@/app/lib/hooks/useToastMessages';

export default function CreateProjectForm() {
  const router = useRouter();
  const { addProject, } = useProjects();
  const { blocks, isLoading: isLoadingBlocks, error: blocksError } = useBlocks();
  const { tagNamesToTags } = useTags();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);

  const { showToast } = useToastMessages();

  const defaultProject = {
    accountId: ADMIN_UUID,
    id: '',
    name: '',
    description: '',
    status: 'pending' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: [],
    blocks: []
  };

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      await addProject(formData);
      showToast('success', 'create', 'project');
      router.push('/dashboard/projects');
    } catch (error) {
      console.error('Failed to create project:', error);
      showToast('error', 'create', 'project');
      setIsSubmitting(false);
    }
  };

  // const handleGetAISuggestions = async () => {
  //   const name = (document.getElementById('name') as HTMLInputElement)?.value || '';
  //   const description = (document.getElementById('description') as HTMLTextAreaElement)?.value || '';
    
  //   const { tags } = await getAISuggestions(name, description);
  //   setSuggestedTags(tags);
  // };

  if (isLoadingBlocks) return <div>Loading blocks...</div>;
  if (blocksError) return <div>Error loading blocks: {blocksError.message}</div>;

  return (
    <ProjectForm
      project={defaultProject}
      blocks={blocks || []}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitButtonText="Create Project"
      cancelHref="/dashboard/projects"
      suggestedTags={suggestedTags}
      // onGetAISuggestions={handleGetAISuggestions}
    />
  );
}