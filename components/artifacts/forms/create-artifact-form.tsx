'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArtifactWithRelations } from "@/app/lib/definitions/definitions";
import { ArtifactForm } from '@/components/artifacts/forms/artifact-form';
import { useArtifacts } from '@/app/lib/hooks/useArtifacts';
import { useProjects } from '@/app/lib/hooks/useProjects';
import { useTags } from '@/app/lib/hooks/useTags';
import { ADMIN_UUID } from '@/app/lib/constants';
import { useToastMessages } from '@/app/lib/hooks/useToastMessages';

export default function CreateArtifactForm() {
  const router = useRouter();
  const { addArtifact, getAISuggestions } = useArtifacts();
  const { projects, isLoading: isLoadingProjects, error: projectsError } = useProjects();
  const { getOrCreateTags } = useTags();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [suggestedContentExtensions, setSuggestedContentExtensions] = useState<string[]>([]);
  const { showToast } = useToastMessages();

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

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      await addArtifact(formData);
      showToast('success', 'create', 'artifact');
      router.push('/dashboard/artifacts');
    } catch (error) {
      console.error('Failed to create artifact:', error);
      showToast('error', 'create', 'artifact');
      setIsSubmitting(false);
    }
  };

  const handleGetAISuggestions = async () => {
    const name = (document.getElementById('name') as HTMLInputElement)?.value || '';
    const description = (document.getElementById('description') as HTMLTextAreaElement)?.value || '';
    const content = (document.querySelector('textarea[name^="content-"]') as HTMLTextAreaElement)?.value || '';
    
    const { tags, extensions } = await getAISuggestions(name, description, content);
    setSuggestedTags(tags);
    setSuggestedContentExtensions(extensions);
  };

  if (isLoadingProjects) return <div>Loading projects...</div>;
  if (projectsError) return <div>Error loading projects: {projectsError.message}</div>;

  return (
    <ArtifactForm
      artifact={defaultArtifact}
      projects={projects || []}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitButtonText="Create Artifact"
      cancelHref="/dashboard/artifacts"
      suggestedTags={suggestedTags}
      suggestedContentExtensions={suggestedContentExtensions}
      onGetAISuggestions={handleGetAISuggestions}
    />
  );
}