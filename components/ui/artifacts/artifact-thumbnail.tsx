import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Artifact, ArtifactContent } from '@/app/lib/definitions';
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
  priority = false,
  className = '',
}) => {
  
  const thumbnailUrl = getArtifactThumbnail(artifact, contentIndex);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`relative overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={thumbnailUrl}
        alt={`Thumbnail for ${artifact.name}`}
        fill
        sizes={`${size}px`}
        style={{ objectFit: "cover" }}
        priority={priority}
        className="rounded-full"
      />
    </motion.div>
  );
};