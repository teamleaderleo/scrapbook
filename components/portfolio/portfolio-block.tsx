import React from 'react';
import { BlockWithRelations } from "@/app/lib/definitions/definitions";
import { ImageContent, ContentDisplay } from './block-display';

export const PortfolioBlock: React.FC<{ block: BlockWithRelations }> = ({ block }) => {
  const mainImage = block.contents.find(c => c.type === 'image');
  const otherContents = block.contents.filter(c => c !== mainImage);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      {mainImage && (
        <div className="aspect-w-16 aspect-h-9">
          <ImageContent content={mainImage} />
        </div>
      )}
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">{block.name}</h3>
        {block.description && <p className="text-sm text-gray-600 mb-2">{block.description}</p>}
        {otherContents.length > 0 && (
          <details className="mb-2">
            <summary className="text-sm font-medium cursor-pointer">Additional Details</summary>
            <div className="mt-2 space-y-2">
              {otherContents.map(content => (
                <ContentDisplay key={content.id} content={content} />
              ))}
            </div>
          </details>
        )}
        {block.tags && block.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {block.tags.map(tag => (
              <span key={tag.id} className="inline-block bg-gray-200 rounded-full px-2 py-1 text-xs font-semibold text-gray-700">
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};