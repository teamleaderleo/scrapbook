import React from 'react';
import { useTags } from '@/app/lib/hooks/useTags';

interface BlockTagsProps {
  blockId: string;
}

const BlockTags: React.FC<BlockTagsProps> = ({ blockId }) => {
  const { useTagsForBlock } = useTags();
  const { data: tags, isLoading, error } = useTagsForBlock(blockId);

  if (isLoading || error || !tags) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {tags.map((tag) => (
        <span key={tag.id} className="bg-[#4f545c] text-white text-xs px-2 py-1 rounded">
          {tag.name}
        </span>
      ))}
    </div>
  );
};

export default BlockTags;