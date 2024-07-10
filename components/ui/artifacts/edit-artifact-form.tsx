'use client';

import React, { useState, useEffect } from 'react';
import { ArtifactDetail, Project } from '@/app/lib/definitions';
import { updateArtifact } from '@/app/lib/artifact-actions';
import { useFormState } from 'react-dom';
import { ADMIN_UUID } from '@/app/lib/constants';
import { ArtifactForm } from '@/components/ui/artifacts/artifact-form';
import { Recommendations } from '@/components/ui/dashboard/recommendations';
import { getRecommendations, suggestTags } from '@/app/lib/claude-utils';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function EditArtifactForm({
  artifact,
  projects,
}: {
  artifact: ArtifactDetail | null;
  projects: Project[];
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const router = useRouter();
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<{projects: string[], artifacts: string[], tags: string[]}>({
    projects: [],
    artifacts: [],
    tags: []
  });
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

  useEffect(() => {
    if (artifact) {
      const fetchSuggestedTags = async () => {
        const content = artifact.contents.map(c => c.type === 'text' ? c.content : '').join(' ');
        const tags = await suggestTags(`${artifact.name} ${artifact.description} ${content}`);
        setSuggestedTags(tags);
      };
      fetchSuggestedTags();
    }
  }, [artifact]);

  if (!artifact) {
    return null;
  }

  const handleSubmit = (formData: FormData) => {
    setIsSubmitting(true);
    formAction(formData);
  };

  const handleGetRecommendations = async () => {
    setIsLoadingRecommendations(true);
    try {
      const result = await getRecommendations({
        artifactId: artifact.id,
        tags: artifact.tags.map(t => t.name),
        includeProjects: true,
        includeArtifacts: true,
        includeTags: true
      });
      setRecommendations(result);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Edit Artifact</h1>
        <Button onClick={handleGetRecommendations} disabled={isLoadingRecommendations}>
          {isLoadingRecommendations ? 'Loading...' : 'Get Recommendations'}
        </Button>
      </div>
      <ArtifactForm
        artifact={artifact}
        projects={projects}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitButtonText="Update Artifact"
        cancelHref="/dashboard/artifacts"
        suggestedTags={suggestedTags}
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
      {(recommendations.projects.length > 0 || recommendations.artifacts.length > 0 || recommendations.tags.length > 0) && (
        <Recommendations
          projectId={artifact.id}
          tags={artifact.tags.map(t => t.name)}
          recommendations={recommendations}
        />
      )}
    </>
  );
}