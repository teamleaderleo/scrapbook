'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Project, ArtifactDetail, ContentType } from '@/app/lib/definitions';
import { createArtifact, State } from '@/app/lib/artifact-actions';
import { useFormState } from 'react-dom';
import { ADMIN_UUID } from '@/app/lib/constants';
import { ArtifactForm } from '@/components/ui/artifacts/artifact-form';
import { suggestTags, suggestContentExtensions } from '@/app/lib/claude-utils';
import { Button } from '@/components/ui/button';

export default function CreateArtifactForm({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [suggestedContentExtensions, setSuggestedContentExtensions] = useState<string[]>([]);
  const initialState: State = { message: null, errors: {} };
  const createArtifactWithAccount = async (prevState: State, formData: FormData) => {
    const result = await createArtifact(ADMIN_UUID, formData);
    return result;
  };
  const [state, formAction] = useFormState(createArtifactWithAccount, initialState);

  const defaultArtifact: ArtifactDetail = {
    account_id: ADMIN_UUID,
    id: '',
    name: '',
    contents: [
      {
        id: '',
        account_id: ADMIN_UUID,
        type: 'text' as ContentType,
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

  const handleSubmit = (formData: FormData) => {
    setIsSubmitting(true);
    formAction(formData);
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

  return (
    <>
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
      />
      {state.message && (
        <p className={`mt-2 text-sm ${state.message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
          {state.message}
        </p>
      )}
    </>
  );
}