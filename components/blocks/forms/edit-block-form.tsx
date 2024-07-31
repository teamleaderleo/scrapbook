'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BlockForm } from '@/components/blocks/forms/block-form';
import { useBlocks } from '@/app/lib/hooks/useBlocks';
import { useProjects } from '@/app/lib/hooks/useProjects';
import { useTags } from '@/app/lib/hooks/useTags';
import { useToastMessages } from '@/app/lib/hooks/useToastMessages';
import { BlockFormSubmission } from '@/app/lib/definitions/definitions';

export default function EditBlockForm({ blockId }: { blockId: string }) {
  const router = useRouter();
  const { blocks, updateBlock, isLoading: isLoadingBlocks } = useBlocks();
  const { projects, isLoading: isLoadingProjects, error: projectsError } = useProjects();
  const { getOrCreateTags } = useTags();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [suggestedContentExtensions, setSuggestedContentExtensions] = useState<string[]>([]);
  const { showToast } = useToastMessages();

  const block = blocks?.find(a => a.id === blockId);

  useEffect(() => {
    if (!isLoadingBlocks && !block) {
      router.replace('/dashboard/blocks');
    }
  }, [block, blockId, router, isLoadingBlocks]);

  if (isLoadingBlocks || isLoadingProjects) {
    return <div>Loading...</div>;
  }

  if (projectsError) {
    return <div>Error loading projects: {projectsError.message}</div>;
  }

  if (!block) {
    return null;
  }

  const handleSubmit = async (data: BlockFormSubmission) => {
    setIsSubmitting(true);
    try {
      await updateBlock({ id: blockId, data });
      showToast('success', 'update', 'block');
      router.push('/dashboard/blocks');
    } catch (error) {
      console.error('Failed to update block:', error);
      showToast('error', 'update', 'block');
      setIsSubmitting(false);
    }
  };

  // const handleGetAISuggestions = async () => {
  //   const content = block.contents.map(c => c.type === 'text' ? c.content : '').join(' ');
  //   const { tags, extensions } = await getAISuggestions(block.name, block.description || '', content);
  //   setSuggestedTags(tags);
  //   setSuggestedContentExtensions(extensions);
  // };

  return (
    <BlockForm
      block={block}
      projects={projects || []}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitButtonText="Update Block"
      cancelHref="/dashboard/blocks"
      suggestedTags={suggestedTags}
      suggestedContentExtensions={suggestedContentExtensions}
      // onGetAISuggestions={handleGetAISuggestions}
    />
  );
}