'use client';

import React, { useState, useEffect } from 'react';
import { ArtifactWithRelations, BaseProject } from '@/app/lib/definitions';
import { updateArtifact } from '@/app/lib/artifact-actions';
import { useFormState } from 'react-dom';
import { ADMIN_UUID } from '@/app/lib/constants';
import { ArtifactForm } from '@/components/ui/artifacts/artifact-form';
import { suggestTags, suggestContentExtensions } from '@/app/lib/claude-utils';
import { useRouter } from 'next/navigation';

export default function EditArtifactForm({
  artifact,
  projects,
}: {
  artifact: ArtifactWithRelations | null;
  projects: BaseProject[];
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const router = useRouter();
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [suggestedContentExtensions, setSuggestedContentExtensions] = useState<string[]>([]);
  const initialState = { message: null, errors: {} };
  const updateArtifactWithId = artifact ? updateArtifact.bind(null, artifact.id, ADMIN_UUID) : null;
  const [state, formAction] = useFormState(updateArtifactWithId || (() => Promise.resolve({})), initialState);

  useEffect(() => {
    if (!artifact) {
      router.replace('/dashboard/artifacts');
    }
  }, [artifact, router]);

  useEffect(() => {
    if (state.message === 'Artifact updated successfully' || state.message === 'Artifact deleted due to lack of content') {
      router.push('/dashboard/artifacts');
    }
    setIsSubmitting(false);
  }, [state, router]);

  if (!artifact) {
    return null;
  }

  const handleSubmit = (formData: FormData) => {
    setIsSubmitting(true);
    formAction(formData);
  };

  const handleGetAISuggestions = async () => {
    setIsLoadingSuggestions(true);
    try {
      const content = artifact.contents.map(c => c.type === 'text' ? c.content : '').join(' ');
      const tags = await suggestTags(`${artifact.name} ${artifact.description} ${content}`);
      setSuggestedTags(tags);
      const extensions = await suggestContentExtensions(content);
      setSuggestedContentExtensions(extensions);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  return (
    <>
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
      />
      {state.message && (
        <p className={`mt-2 text-sm ${
          state.message.includes('Error') ? 'text-red-500' : 
          state.message.includes('deleted') ? 'text-yellow-500' : 'text-green-500'
        }`}>
          {state.message}
        </p>
      )}
      {state.errors && Object.entries(state.errors).map(([field, errors]) => (
        <p key={field} className="mt-2 text-sm text-red-500">
          {field}: {errors.join(', ')}
        </p>
      ))}
    </>
  );
}