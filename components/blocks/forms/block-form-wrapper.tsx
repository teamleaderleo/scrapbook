'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BlockForm } from '@/components/blocks/forms/block-form';
import { useBlocks } from '@/app/lib/hooks/useBlocks';
import { useProjects } from '@/app/lib/hooks/useProjects';
import { useTags } from '@/app/lib/hooks/useTags';
import { useToastMessages } from '@/app/lib/hooks/useToastMessages';
import { BlockWithRelations } from '@/app/lib/definitions/definitions';
import { ADMIN_UUID } from '@/app/lib/constants';

interface BlockFormWrapperProps {
  blockId?: string; // Optional: if provided, we're editing an existing block
}

export function BlockFormWrapper({ blockId }: BlockFormWrapperProps) {
  const router = useRouter();
  const { blocks, addBlock, updateBlock, isLoading: isLoadingBlocks } = useBlocks();
  const { projects, isLoading: isLoadingProjects, error: projectsError } = useProjects();
  const { tagNames } = useTags();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToastMessages();

  const block = blockId ? blocks?.find(a => a.id === blockId) : null;

  useEffect(() => {
    if (blockId && !isLoadingBlocks && !block) {
      router.replace('/dashboard/blocks');
    }
  }, [block, blockId, router, isLoadingBlocks]);

  if (isLoadingBlocks || isLoadingProjects) {
    return <div>Loading...</div>;
  }

  if (projectsError) {
    return <div>Error loading projects: {projectsError.message}</div>;
  }

  const handleSubmit = async (data: BlockFormSubmission) => {
    setIsSubmitting(true);
    try {
      if (blockId) {
        await updateBlock({ id: blockId, data });
        showToast('success', 'update', 'block');
      } else {
        await addBlock(data);
        showToast('success', 'create', 'block');
      }
      router.push('/dashboard/blocks');
    } catch (error) {
      console.error(`Failed to ${blockId ? 'update' : 'create'} block:`, error);
      showToast('error', blockId ? 'update' : 'create', 'block');
      setIsSubmitting(false);
    }
  };

  const defaultBlock: BlockWithRelations = {
    accountId: ADMIN_UUID,
    id: '',
    content: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: [],
    projects: []
  };

  return (
    <BlockForm
      block={block || defaultBlock}
      projects={projects || []}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitButtonText={blockId ? "Update Block" : "Create Block"}
      cancelHref="/dashboard/blocks"
      allTags={tagNames}
    />
  );
}