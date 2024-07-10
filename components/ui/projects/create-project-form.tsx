'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArtifactDetail } from '@/app/lib/definitions';
import { createProject, State } from '@/app/lib/actions';
import { useFormState } from 'react-dom';
import { ADMIN_UUID } from '@/app/lib/constants';
import { ProjectForm } from '@/components/ui/projects/project-form';

export default function CreateProjectForm({ artifacts }: { artifacts: ArtifactDetail[] }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialState: State = { message: null, errors: {} };
  const createProjectWithAccount = createProject.bind(null, ADMIN_UUID);
  const [state, formAction] = useFormState(createProjectWithAccount, initialState);

  useEffect(() => {
    if (state.message === 'Project created successfully') {
      setIsSubmitting(false);
      setTimeout(() => router.push('/dashboard/projects'), 2000);
    } else if (state.message) {
      setIsSubmitting(false);
    }
  }, [state, router]);

  const handleSubmit = (formData: FormData) => {
    setIsSubmitting(true);
    formAction(formData);
  };

  return (
    <>
      <ProjectForm
        artifacts={artifacts}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitButtonText="Create Project"
        cancelHref="/dashboard/projects"
      />
      {state.message && (
        <p className={`mt-2 text-sm ${state.message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
          {state.message}
        </p>
      )}
    </>
  );
}