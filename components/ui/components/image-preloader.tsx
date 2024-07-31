import { useEffect } from 'react';
import { ArtifactWithRelations } from "@/app/lib/definitions/definitions";
import { getArtifactThumbnail } from '@/app/lib/utils-client';

export const useImagePreloader = (blocks: ArtifactWithRelations[]) => {
  useEffect(() => {
    blocks.forEach((block) => {
      const thumbnailData = getArtifactThumbnail(block);
      const img = new Image();
      img.src = thumbnailData.src;
      img.width = thumbnailData.width;
      img.height = thumbnailData.height;
    });
  }, [blocks]);
};