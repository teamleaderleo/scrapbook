import { useEffect } from 'react';
import { ArtifactWithRelations } from '@/app/lib/definitions';
import { getArtifactThumbnail } from '@/app/lib/utils-client';

export const useImagePreloader = (artifacts: ArtifactWithRelations[]) => {
  useEffect(() => {
    artifacts.forEach((artifact) => {
      const img = new Image();
      img.src = getArtifactThumbnail(artifact);
    });
  }, [artifacts]);
};