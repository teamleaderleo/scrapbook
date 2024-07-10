'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Project, ArtifactDetail, ContentType } from '@/app/lib/definitions';
import { createArtifact, State } from '@/app/lib/artifact-actions';
import { useFormState } from 'react-dom';
import { ADMIN_UUID } from '@/app/lib/constants';
import { ArtifactForm } from '@/components/ui/artifacts/artifact-form';

export default function CreateArtifactForm({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialState: State = { message: null, errors: {} };
  const createArtifactWithAccount = async (prevState: State, formData: FormData) => {
    return createArtifact(ADMIN_UUID, formData);
  };
  const [state, formAction] = useFormState(createArtifactWithAccount, initialState);

  // Create a default artifact object
  const defaultArtifact: ArtifactDetail = {
    account_id: ADMIN_UUID,
    id: '',
    name: '',
    contents: [
      {
        id: '',
        account_id: ADMIN_UUID,
        type: 'image' as ContentType,
        content: '',
        created_at: new Date().toISOString(),
      }
    ],
    description: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tags: [],
    projects: []
  };

  useEffect(() => {
    if (state.message === 'Artifact created successfully') {
      setIsSubmitting(false);
      setTimeout(() => router.push('/dashboard/artifacts'), 2000);
    } else if (state.message) {
      setIsSubmitting(false);
    }
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
        artifact={defaultArtifact}
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