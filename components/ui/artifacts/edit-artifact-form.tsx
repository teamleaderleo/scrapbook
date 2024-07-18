'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tag } from '@/app/lib/definitions';
import { ArtifactForm } from '@/components/ui/artifacts/artifact-form';
import { useArtifacts } from '@/app/lib/hooks/useArtifacts';
import { useProjects } from '@/app/lib/hooks/useProjects';
import { useTagStore } from '@/app/lib/store/tag-store';
import { ADMIN_UUID } from '@/app/lib/constants';

export default function EditArtifactForm({ artifactId }: { artifactId: string }) {
  const router = useRouter();
  const { artifacts, updateArtifact, isLoading: isLoadingArtifacts, getAISuggestions } = useArtifacts();
  const { projects, isLoading: isLoadingProjects, error: projectsError } = useProjects();
  const { allTags, fetchAllTags, getOrCreateTags } = useTagStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [suggestedContentExtensions, setSuggestedContentExtensions] = useState<string[]>([]);

  const artifact = artifacts?.find(a => a.id === artifactId);

  useEffect(() => {
    fetchAllTags(ADMIN_UUID);
  }, [fetchAllTags]);

  useEffect(() => {
    if (!isLoadingArtifacts && !artifact) {
      router.replace('/dashboard/artifacts');
    }
  }, [artifact, artifactId, router, isLoadingArtifacts]);

  if (isLoadingArtifacts || isLoadingProjects) {
    return <div>Loading...</div>;
  }

  if (projectsError) {
    return <div>Error loading projects: {projectsError.message}</div>;
  }

  if (!artifact) {
    return null;
  }

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      await updateArtifact({ id: artifactId, formData });
      router.push('/dashboard/artifacts');
    } catch (error) {
      console.error('Failed to update artifact:', error);
      setIsSubmitting(false);
    }
  };

  const handleGetAISuggestions = async () => {
    const content = artifact.contents.map(c => c.type === 'text' ? c.content : '').join(' ');
    const { tags, extensions } = await getAISuggestions(artifact.name, artifact.description || '', content);
    setSuggestedTags(tags);
    setSuggestedContentExtensions(extensions);
  };

  const handleTagsChange = async (newTags: Tag[]) => {
    const tagNames = newTags.map(tag => tag.name);
    await getOrCreateTags(ADMIN_UUID, tagNames);
  };

  return (
    <ArtifactForm
      artifact={artifact}
      projects={projects || []}
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