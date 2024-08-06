import React, { useState, useCallback } from 'react';
import { useTags } from '@/app/lib/hooks/useTags';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Smile } from 'lucide-react';

interface TagManagerProps {
  blockId: string;
  showOnHover: boolean;
}

const TagManager: React.FC<TagManagerProps> = ({ blockId, showOnHover }) => {
  const { addTag, associateTagWithBlock, useTagsForBlock } = useTags();
  const [isAddingTag, setIsAddingTag] = useState(false);
  const { data: tags, isLoading, error } = useTagsForBlock(blockId);

  const handleAddTag = useCallback(async (content: string) => {
    const tagState = await addTag(content);
    if (tagState.success && tagState.tag) {
      await associateTagWithBlock({ tagId: tagState.tag.id, blockId });
      setIsAddingTag(false);
    }
  }, [addTag, associateTagWithBlock, blockId]);

  if (isLoading) return null;
  if (error) return null;

  const tagList = (
    <>
      {tags && tags.map((tag) => (
        <span key={tag.id} className="bg-[#4f545c] text-white text-xs px-2 py-1 rounded mr-1">
          {tag.name}
        </span>
      ))}
    </>
  );

  const addTagButton = (
    <Popover open={isAddingTag} onOpenChange={setIsAddingTag}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          className="text-[#b9bbbe] hover:text-white hover:bg-[#3f4248] rounded-none h-10 w-10 p-0"
        >
          <Smile className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <h4 className="font-medium leading-none">Add Tag</h4>
          <Input
            placeholder="Enter tag or emoji"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddTag(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );

  if (showOnHover) {
    return tagList;
  } else {
    return addTagButton;
  }
};

export default TagManager;