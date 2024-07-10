'use client';

import React, { useState, useEffect } from 'react';
import { ArtifactDetail, Project } from '@/app/lib/definitions';
import { updateArtifact } from '@/app/lib/artifact-actions';
import { useFormState } from 'react-dom';
import { ADMIN_UUID } from '@/app/lib/constants';
import { ArtifactForm } from '@/components/ui/artifacts/artifact-form';
import { useRouter } from 'next/navigation';

export default function EditArtifactForm({
  artifact,
  projects,
}: {
  artifact: ArtifactDetail;
  projects: Project[];
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const initialState = { message: null, errors: {} };
  const updateArtifactWithId = updateArtifact.bind(null, artifact.id, ADMIN_UUID);
  const [state, formAction] = useFormState(updateArtifactWithId, initialState);

  useEffect(() => {
    if (state.message === 'Artifact updated successfully' || state.message === 'Artifact deleted due to lack of content') {
      router.push('/dashboard/artifacts');
    }
    setIsSubmitting(false);
  }, [state, router]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    formAction(formData);
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
      />
      {state.message && (
        <p className={`mt-2 text-sm ${state.message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
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