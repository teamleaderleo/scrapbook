import React from 'react';
import { useTags } from '@/app/lib/hooks/useTags';
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';

interface BlockTagsProps {
  blockId: string;
}

const BlockTags: React.FC<BlockTagsProps> = ({ blockId }) => {
  const { useTagsForBlock, disassociateTagFromBlock } = useTags();
  const { data: tags, isLoading, error, refetch } = useTagsForBlock(blockId);

  const handleRemoveTag = async (tagId: string) => {
    await disassociateTagFromBlock({ tagId, blockId });
    refetch();
  };

  if (isLoading || error || !tags) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {tags.map((tag) => (
        <Button
          key={tag.id}
          variant="secondary"
          size="sm"
          className="flex items-center space-x-1 bg-[#4f545c] text-white text-xs px-2 py-1 rounded"
        >
          <span>{tag.name}</span>
          <X
            className="h-3 w-3 cursor-pointer"
            onClick={() => handleRemoveTag(tag.id)}
          />
        </Button>
      ))}
    </div>
  );
};

export default BlockTags;