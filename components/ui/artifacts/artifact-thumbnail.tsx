import React, { useState } from 'react';
import Image from 'next/image';
import { Artifact, ArtifactContent } from '@/app/lib/definitions';
import { getBlurDataUrl } from '@/app/lib/utils-client';

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

  const [isLoading, setIsLoading] = useState(true);
  const getArtifactThumbnail = (artifact: Artifact, index: number): string => {
    if (!artifact || !artifact.contents || artifact.contents.length === 0) {
      return '/placeholder-default.png';
    }
    const content: ArtifactContent = artifact.contents[index];
    if (!content) {
      return '/placeholder-default.png';
    }

    switch (content.type) {
      case 'image':
        if (typeof content.content === 'string') {
          try {
            const url = new URL(content.content);
            return url.toString();
          } catch {
            console.warn(`Invalid URL for artifact ${artifact.id}: ${content.content}`);
            return '/placeholder-default.png';
          }
        }
        return '/placeholder-default.png';
      case 'text':
        return '/placeholder-text.png';
      case 'file':
        return '/placeholder-file.png';
      default:
        return '/placeholder-default.png';
    }
  };
  
  const thumbnailUrl = getArtifactThumbnail(artifact, contentIndex);
  console.log('Thumbnail URL:', thumbnailUrl);

  try {
    return (
      <Image
        src={thumbnailUrl}
        alt={`Thumbnail for ${artifact.name}`}
        width={size}
        height={size}
        objectFit="cover"
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        placeholder='blur'
        blurDataURL={getBlurDataUrl(size, size)}
        className={`rounded-full ${className}`}
      />
    );
  } catch (error) {
    console.error('Error rendering Image:', error);
    return <div className={`rounded-full bg-gray-200 ${className}`}></div>;
  }
};