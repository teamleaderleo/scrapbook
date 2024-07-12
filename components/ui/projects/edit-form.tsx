'use client';

import React, { useState } from 'react';
import { ArtifactWithRelations, ProjectWithRelations } from '@/app/lib/definitions';
import { updateProject } from '@/app/lib/actions';
import { useFormState } from 'react-dom';
import { ADMIN_UUID } from '@/app/lib/constants';
import { ProjectForm } from '@/components/ui/projects/project-form';

export default function EditProjectForm({
  project,
  artifacts,
}: {
  project: ProjectWithRelations;
  artifacts: ArtifactWithRelations[];
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialState = { message: null, errors: {} };
  const updateProjectWithId = updateProject.bind(null, project.id, ADMIN_UUID);
  const [state, formAction] = useFormState(updateProjectWithId, initialState);

  const handleSubmit = (formData: FormData) => {
    setIsSubmitting(true);
    formAction(formData);
  };

  return (
    <>
      <ProjectForm
        project={project}
        artifacts={artifacts}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitButtonText="Update Project"
        cancelHref="/dashboard/projects"
      />
      {state.message && (
        <p className="mt-2 text-sm text-red-500">{state.message}</p>
      )}
    </>
  );
}