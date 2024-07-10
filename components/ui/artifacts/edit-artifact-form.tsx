'use client';

import React, { useState } from 'react';
import { ArtifactDetail, Project } from '@/app/lib/definitions';
import { updateArtifact } from '@/app/lib/artifact-actions';
import { useFormState } from 'react-dom';
import { ADMIN_UUID } from '@/app/lib/constants';
import { ArtifactForm } from '@/components/ui/artifacts/artifact-form';

export default function EditArtifactForm({
  artifact,
  projects,
}: {
  artifact: ArtifactDetail;
  projects: Project[];
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialState = { message: null, errors: {} };
  const updateArtifactWithId = updateArtifact.bind(null, artifact.id, ADMIN_UUID);
  const [state, formAction] = useFormState(updateArtifactWithId, initialState);

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
        <p className="mt-2 text-sm text-red-500">{state.message}</p>
      )}
    </>
  );
}