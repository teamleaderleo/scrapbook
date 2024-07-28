import { useEffect } from 'react';
import { ArtifactWithRelations } from "@/app/lib/definitions/artifact-definitions";
import { getArtifactThumbnail } from '@/app/lib/utils-client';

export const useImagePreloader = (artifacts: ArtifactWithRelations[]) => {
  useEffect(() => {
    artifacts.forEach((artifact) => {
      const thumbnailData = getArtifactThumbnail(artifact);
      const img = new Image();
      img.src = thumbnailData.src;
      img.width = thumbnailData.width;
      img.height = thumbnailData.height;
    });
  }, [artifacts]);
};