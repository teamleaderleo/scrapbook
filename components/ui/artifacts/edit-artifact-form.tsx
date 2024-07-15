// edit-artifact-form.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArtifactWithRelations, BaseProject, Tag } from '@/app/lib/definitions';
import { ArtifactForm } from '@/components/ui/artifacts/artifact-form';
import { suggestTags, suggestContentExtensions } from '@/app/lib/external/claude-utils';
import { useArtifactStore } from '@/app/lib/store/artifacts/artifact-store';
import { useTagStore } from '@/app/lib/store/tag-store';
import { ADMIN_UUID } from '@/app/lib/constants';

export default function EditArtifactForm({
  artifactId,
  projects,
}: {
  artifactId: string;
  projects: BaseProject[];
}) {
  const router = useRouter();
  const { artifacts, updateArtifact, setCurrentArtifact } = useArtifactStore();
  const { allTags, fetchAllTags, ensureTagsExist } = useTagStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [suggestedContentExtensions, setSuggestedContentExtensions] = useState<string[]>([]);

  const artifact = artifacts.find(a => a.id === artifactId);

  useEffect(() => {
    if (!artifact) {
      router.replace('/dashboard/artifacts');
    } else {
      setCurrentArtifact(artifact);
    }
    fetchAllTags(ADMIN_UUID);
  }, [artifact, artifactId, router, fetchAllTags, setCurrentArtifact]);

  if (!artifact) {
    return null;
  }

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      await updateArtifact(artifactId, formData);
      router.push('/dashboard/artifacts');
    } catch (error) {
      console.error('Failed to update artifact:', error);
      setIsSubmitting(false);
    }
  };

  const handleGetAISuggestions = async () => {
    const content = artifact.contents.map(c => c.type === 'text' ? c.content : '').join(' ');
    const tags = await suggestTags(`${artifact.name} ${artifact.description} ${content}`);
    setSuggestedTags(tags);
    const extensions = await suggestContentExtensions(content);
    setSuggestedContentExtensions(extensions);
  };

  const handleTagsChange = async (newTags: Tag[]) => {
    const tagNames = newTags.map(tag => tag.name);
    await ensureTagsExist(ADMIN_UUID, tagNames);
  };

  return (
    <ArtifactForm
      artifact={artifact}
      projects={projects}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitButtonText="Update Artifact"
      cancelHref="/dashboard/artifacts"
      suggestedTags={suggestedTags}
      suggestedContentExtensions={suggestedContentExtensions}
      onGetAISuggestions={handleGetAISuggestions}
      allTags={allTags}
      onTagsChange={handleTagsChange}
    />
  );
}