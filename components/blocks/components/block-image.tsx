import React, { useState } from 'react';
import Image from 'next/image';
import { Block } from "@/app/lib/definitions/definitions";
import { THUMBNAIL_CONFIGS } from '@/app/lib/image-processing/image-processing';
import { generateColorGradient } from '@/app/lib/image-processing/image-processing';

interface BlockImageProps {
  block: Block;
  size: 'small' | 'medium' | 'large';
}

const ColorGradient: React.FC<{ colors: string[] }> = ({ colors }) => (
  <div 
    className="absolute inset-0" 
    style={{ background: generateColorGradient(colors) }}
  />
);

export const BlockImage: React.FC<BlockImageProps> = ({ block, size }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const content = block.contents.find(c => c.type === 'image');
  if (!content || !content.metadata || content.type !== 'image') {
    return null; // or a placeholder
  }

  const src = content.metadata.variations[size] || content.metadata.variations.compressed;

  return (
    <div className="relative">
      {!imageLoaded && content.metadata.dominantColors && (
        <ColorGradient colors={content.metadata.dominantColors} />
      )}
      <Image
        src={src}
        alt={block.name}
        width={THUMBNAIL_CONFIGS[size].width}
        height={THUMBNAIL_CONFIGS[size].height}
        layout="responsive"
        onLoad={() => setImageLoaded(true)}
      />
    </div>
  );
};