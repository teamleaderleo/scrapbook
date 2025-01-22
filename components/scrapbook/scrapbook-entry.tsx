'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Code } from 'lucide-react';
import Image from 'next/image';
import CodePreview from './code-preview';
import ImagePreview from './image-preview';

interface ScrapbookItem {
  id: string;
  text: string;
  attachments?: {
    code?: {
      title: string;
      content: string;
    }[];
    images?: {
      src: string;
      alt: string;
    }[];
  };
}

interface ScrapbookEntryProps {
  item: ScrapbookItem;
  isGridLayout: boolean;
}

const ScrapbookEntry = ({ item, isGridLayout }: { 
  item: ScrapbookItem; 
  isGridLayout: boolean;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasAttachments = item.attachments && 
    ((item.attachments.code?.length ?? 0) + (item.attachments.images?.length ?? 0) > 0);

  const getExpandedTransform = (type: 'image' | 'code') => {
    if (!isGridLayout) {
      return type === 'image' ? 'translate-x-[320px]' : 'translate-x-[640px]';
    }
    return type === 'image' ? 'translate-y-[320px]' : 'translate-y-[440px]';
  };

  return (
    <div 
      className={`
        relative min-h-[120px] group
        ${hasAttachments ? 'cursor-pointer' : ''}
        ${isExpanded ? (isGridLayout ? 'h-[600px]' : 'min-w-[1000px]') : 'w-80'} 
        transition-all duration-300
      `}
      onClick={() => hasAttachments && setIsExpanded(!isExpanded)}
    >
      {hasAttachments && (
        <>
          {item.attachments?.code?.map((code, idx) => (
            <CodePreview
              key={`code-${idx}`}
              code={code}
              isExpanded={isExpanded}
              transformClass={isExpanded 
                ? `${getExpandedTransform('code')} !w-96` 
                : 'group-hover:translate-x-4 group-hover:-translate-y-3'
              }
            />
          ))}
          {item.attachments?.images?.map((image, idx) => (
            <ImagePreview
              key={`img-${idx}`}
              image={image}
              isExpanded={isExpanded}
              transformClass={isExpanded 
                ? getExpandedTransform('image')
                : 'group-hover:translate-x-2 group-hover:translate-y-2'
              }
            />
          ))}
        </>
      )}
      <Card className={`
        relative bg-yellow-50 p-4 w-80
        transition-all duration-300 ease-out
        ${!isExpanded ? 'group-hover:-translate-x-2 group-hover:-translate-y-2' : ''}
      `}>
        <p className="font-mono text-sm">{item.text}</p>
      </Card>
    </div>
  );
};

export default ScrapbookEntry;