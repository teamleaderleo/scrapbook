import React from 'react';
import { Button } from '@/components/ui/button';

interface SuggestedTagsProps {
  suggestedTags: string[];
  onAddTag: (tag: string) => void;
}

export function SuggestedTags({ suggestedTags, onAddTag }: SuggestedTagsProps) {
  return (
    <div className="mt-4">
      <h3 className="font-semibold">AI-Suggested Tags</h3>
      <div className="flex flex-wrap gap-2 mt-2">
        {suggestedTags.map((tag, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => onAddTag(tag)}
          >
            {tag}
          </Button>
        ))}
      </div>
    </div>
  );
}