import { useEffect } from 'react';
import { BlockWithRelations } from "@/app/lib/definitions/definitions";
import { getBlockThumbnail } from '@/app/lib/utils-client';

export const useImagePreloader = (blocks: BlockWithRelations[]) => {
  useEffect(() => {
    blocks.forEach((block) => {
      const thumbnailData = getBlockThumbnail(block);
      const img = new Image();
      img.src = thumbnailData.src;
      img.width = thumbnailData.width;
      img.height = thumbnailData.height;
    });
  }, [blocks]);
};