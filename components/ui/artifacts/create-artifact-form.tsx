'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BaseProject, ArtifactWithRelations, Tag } from '@/app/lib/definitions';
import { ArtifactForm } from '@/components/ui/artifacts/artifact-form';
import { suggestTags, suggestContentExtensions } from '@/app/lib/external/claude-utils';
import { useArtifactQueries } from '@/app/lib/store/artifacts/use-artifact-queries';
import { useTagStore } from '@/app/lib/store/tag-store';
import { ADMIN_UUID } from '@/app/lib/constants';

export default function CreateArtifactForm({ projects }: { projects: BaseProject[] }) {
  const router = useRouter();
  const { addArtifact } = useArtifactQueries();
  const { allTags, fetchAllTags, ensureTagsExist } = useTagStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [suggestedContentExtensions, setSuggestedContentExtensions] = useState<string[]>([]);

  const defaultArtifact: ArtifactWithRelations = {
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

  useEffect(() => {
    fetchAllTags(ADMIN_UUID);
  }, [fetchAllTags]);

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      await addArtifact(formData);
      router.push('/dashboard/artifacts');
    } catch (error) {
      console.error('Failed to create artifact:', error);
      setIsSubmitting(false);
    }
  };

  const handleGetAISuggestions = async () => {
    const name = (document.getElementById('name') as HTMLInputElement)?.value || '';
    const description = (document.getElementById('description') as HTMLTextAreaElement)?.value || '';
    const content = (document.querySelector('textarea[name^="content-"]') as HTMLTextAreaElement)?.value || '';
    
    const tags = await suggestTags(`${name} ${description} ${content}`);
    setSuggestedTags(tags);
    
    const extensions = await suggestContentExtensions(`${name} ${description} ${content}`);
    setSuggestedContentExtensions(extensions);
  };

  const handleTagsChange = async (newTags: Tag[]) => {
    const tagNames = newTags.map(tag => tag.name);
    await ensureTagsExist(ADMIN_UUID, tagNames);
  };

  return (
    <ArtifactForm
      artifact={defaultArtifact}
      projects={projects}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitButtonText="Create Artifact"
      cancelHref="/dashboard/artifacts"
      suggestedTags={suggestedTags}
      suggestedContentExtensions={suggestedContentExtensions}
      onGetAISuggestions={handleGetAISuggestions}
      allTags={allTags}
      onTagsChange={handleTagsChange}
    />
  );
}