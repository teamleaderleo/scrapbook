'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BlockWithRelations } from "@/app/lib/definitions/definitions";
import { BlockForm } from '@/components/blocks/forms/block-form';
import { useBlocks } from '@/app/lib/hooks/useBlocks';
import { useProjects } from '@/app/lib/hooks/useProjects';
import { useTags } from '@/app/lib/hooks/useTags';
import { ADMIN_UUID } from '@/app/lib/constants';
import { useToastMessages } from '@/app/lib/hooks/useToastMessages';
import { BlockFormSubmission } from '@/app/lib/definitions/definitions';

export default function CreateBlockForm() {
  const router = useRouter();
  const { addBlock } = useBlocks();
  const { projects, isLoading: isLoadingProjects, error: projectsError } = useProjects();
  const { getOrCreateTags } = useTags();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [suggestedContentExtensions, setSuggestedContentExtensions] = useState<string[]>([]);
  const { showToast } = useToastMessages();

  const defaultBlock: BlockWithRelations = {
    accountId: ADMIN_UUID,
    id: '',
    name: '',
    contents: [],
    description: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: [],
    projects: []
  };

  const handleSubmit = async (data: BlockFormSubmission) => {
    setIsSubmitting(true);
    try {
      await addBlock(data);
      showToast('success', 'create', 'block');
      router.push('/dashboard/blocks');
    } catch (error) {
      console.error('Failed to create block:', error);
      showToast('error', 'create', 'block');
      setIsSubmitting(false);
    }
  };

  // const handleGetAISuggestions = async () => {
  //   const name = (document.getElementById('name') as HTMLInputElement)?.value || '';
  //   const description = (document.getElementById('description') as HTMLTextAreaElement)?.value || '';
  //   const content = (document.querySelector('textarea[name^="content-"]') as HTMLTextAreaElement)?.value || '';
    
  //   const { tags, extensions } = await getAISuggestions(name, description, content);
  //   setSuggestedTags(tags);
  //   setSuggestedContentExtensions(extensions);
  // };

  if (isLoadingProjects) return <div>Loading projects...</div>;
  if (projectsError) return <div>Error loading projects: {projectsError.message}</div>;

  return (
    <BlockForm
      block={defaultBlock}
      projects={projects || []}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitButtonText="Create Block"
      cancelHref="/dashboard/blocks"
      suggestedTags={suggestedTags}
      suggestedContentExtensions={suggestedContentExtensions}
      // onGetAISuggestions={handleGetAISuggestions}
    />
  );
}