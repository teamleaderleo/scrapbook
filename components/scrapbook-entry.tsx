'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Code } from 'lucide-react';
import Image from 'next/image';

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

const ScrapbookEntry = ({ item, isGridLayout }: ScrapbookEntryProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasAttachments = item.attachments && 
    ((item.attachments.code?.length ?? 0) + (item.attachments.images?.length ?? 0) > 0);

  const getExpandedTransform = (type: 'image' | 'code') => {
    if (!isGridLayout) {
      // Vertical layout, so expand to right
      return type === 'image' ? 'translate-x-[320px]' : 'translate-x-[640px]';
    } else {
      // Grid layout, so expand downward
      return type === 'image' ? 'translate-y-[320px]' : 'translate-y-[440px]';
    }
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
      {/* Stacked background items */}
      {hasAttachments && (
        <>
          {/* Code peek (furthest back) */}
          {item.attachments?.code?.map((code, idx) => (
            <Card
              key={`code-${idx}`}
              className={`
                absolute top-0 left-0 bg-white border-2 border-gray-200
                transition-all duration-300 ease-out
                rotate-2 w-80
                ${isExpanded 
                  ? `${getExpandedTransform('code')} !w-96` 
                  : 'group-hover:translate-x-4 group-hover:-translate-y-3'
                }
              `}
            >
              {isExpanded ? (
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Code className="w-4 h-4" />
                    <span className="text-sm font-medium">{code.title}</span>
                  </div>
                  <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                    {code.content}
                  </pre>
                </div>
              ) : (
                <div className="h-[120px]">
                  <div className="absolute top-2 right-2">
                    <Code className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              )}
            </Card>
          ))}

          {/* Image peek (middle) */}
          {item.attachments?.images?.map((img, idx) => (
            <Card
              key={`img-${idx}`}
              className={`
                absolute top-0 left-0 bg-gray-50 border border-gray-200
                transition-all duration-300 ease-out
                -rotate-1 w-80
                ${isExpanded 
                  ? getExpandedTransform('image')
                  : 'group-hover:translate-x-2 group-hover:translate-y-2'
                }
              `}
            >
              {isExpanded ? (
                <div className="p-2">
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="rounded w-full h-auto"
                  />
                </div>
              ) : (
                <div className="h-[120px]">
                  <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                    IMG
                  </div>
                </div>
              )}
            </Card>
          ))}
        </>
      )}

      {/* Main note card (front) */}
      <Card 
        className={`
          relative bg-yellow-50 p-4 w-80
          transition-all duration-300 ease-out
          ${!isExpanded ? 'group-hover:-translate-x-2 group-hover:-translate-y-2' : ''}
        `}
      >
        <p className="font-mono text-sm">{item.text}</p>
      </Card>
    </div>
  );
};

export default ScrapbookEntry;