'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Project } from '@/app/lib/definitions';
import { createArtifact, State } from '@/app/lib/artifact-actions';
import { useFormState } from 'react-dom';
import { ADMIN_UUID } from '@/app/lib/constants';
import { ArtifactForm } from '@/components/ui/artifacts/artifact-form';

export default function CreateArtifactForm({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialState: State = { message: null, errors: {} };
  const createArtifactWithAccount = createArtifact.bind(null, ADMIN_UUID);
  const [state, formAction] = useFormState(createArtifactWithAccount, initialState);

  useEffect(() => {
    if (state.message === 'Artifact created successfully') {
      setIsSubmitting(false);
      setTimeout(() => router.push('/dashboard/artifacts'), 2000);
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
      <ArtifactForm
        projects={projects}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitButtonText="Create Artifact"
        cancelHref="/dashboard/artifacts"
      />
      {state.message && (
        <p className={`mt-2 text-sm ${state.message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
          {state.message}
        </p>
      )}
    </>
  );
}