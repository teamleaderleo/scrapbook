'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArtifactForm } from '@/components/blocks/forms/block-form';
import { useArtifacts } from '@/app/lib/hooks/useArtifacts';
import { useProjects } from '@/app/lib/hooks/useProjects';
import { useTags } from '@/app/lib/hooks/useTags';
import { useToastMessages } from '@/app/lib/hooks/useToastMessages';
import { ArtifactFormSubmission } from '@/app/lib/definitions/definitions';

export default function EditArtifactForm({ blockId }: { blockId: string }) {
  const router = useRouter();
  const { blocks, updateArtifact, isLoading: isLoadingArtifacts } = useArtifacts();
  const { projects, isLoading: isLoadingProjects, error: projectsError } = useProjects();
  const { getOrCreateTags } = useTags();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [suggestedContentExtensions, setSuggestedContentExtensions] = useState<string[]>([]);
  const { showToast } = useToastMessages();

  const block = blocks?.find(a => a.id === blockId);

  useEffect(() => {
    if (!isLoadingArtifacts && !block) {
      router.replace('/dashboard/blocks');
    }
  }, [block, blockId, router, isLoadingArtifacts]);

  if (isLoadingArtifacts || isLoadingProjects) {
    return <div>Loading...</div>;
  }

  if (projectsError) {
    return <div>Error loading projects: {projectsError.message}</div>;
  }

  if (!block) {
    return null;
  }

  const handleSubmit = async (data: ArtifactFormSubmission) => {
    setIsSubmitting(true);
    try {
      await updateArtifact({ id: blockId, data });
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
    <ArtifactForm
      block={block}
      projects={projects || []}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitButtonText="Update Artifact"
      cancelHref="/dashboard/blocks"
      suggestedTags={suggestedTags}
      suggestedContentExtensions={suggestedContentExtensions}
      // onGetAISuggestions={handleGetAISuggestions}
    />
  );
}