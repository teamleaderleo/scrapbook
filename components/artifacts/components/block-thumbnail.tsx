'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Artifact } from "@/app/lib/definitions/definitions";
import { getArtifactThumbnail } from '@/app/lib/utils-client';

interface ArtifactThumbnailProps {
  artifact: Artifact;
  contentIndex?: number;
  size?: number;
  priority?: boolean;
  className?: string;
}

export const ArtifactThumbnail: React.FC<ArtifactThumbnailProps> = ({ 
  artifact, 
  contentIndex = 0, 
  size = 40,
  priority = true,
  className = '',
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const thumbnailUrl = getArtifactThumbnail(artifact, contentIndex);

  return (
    <div 
    >
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className={`relative overflow-hidden ${className}`}
            style={{ width: size, height: size }}
          />
        )}
      </AnimatePresence>
      <Image
        src={thumbnailUrl}
        alt={`Thumbnail for ${artifact.name}`}
        fill
        sizes={`${size}px`}
        style={{ objectFit: "cover" }}
        priority={priority}
        className={`rounded-full`}
        onLoad={() => setIsLoading(true)}
      />
    </div>
  );
};