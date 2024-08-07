import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTags } from '@/app/lib/hooks/useTags';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Smile, Plus } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";

interface TagManagerProps {
  blockId: string;
  onOpenChange?: (isOpen: boolean) => void;
}

const TagManager: React.FC<TagManagerProps> = ({ blockId, onOpenChange }) => {
  const { tags, addTag, associateTagWithBlock, useTagsForBlock } = useTags();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: blockTags } = useTagsForBlock(blockId);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleAddTag = useCallback(async (content: string) => {
    let tagId: string;
    const existingTag = tags.find(tag => tag.name.toLowerCase() === content.toLowerCase());
    
    if (existingTag) {
      tagId = existingTag.id;
    } else {
      const tagState = await addTag(content);
      if (!tagState.success || !tagState.tag) {
        console.error('Failed to create tag:', tagState.message);
        return;
      }
      tagId = tagState.tag.id;
    }

    await associateTagWithBlock({ tagId, blockId });
    setInputValue('');
  }, [addTag, associateTagWithBlock, blockId, tags]);

  const isTagAlreadyAdded = (tagName: string) => {
    return blockTags?.some(tag => tag.name.toLowerCase() === tagName.toLowerCase());
  };

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        onOpenChange?.(open);
      }}
    >
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
          <div className="flex items-center space-x-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter tag or emoji"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && inputValue.trim()) {
                  handleAddTag(inputValue.trim());
                }
                e.stopPropagation();
              }}
            />
            <Button 
              size="sm" 
              onClick={() => inputValue.trim() && handleAddTag(inputValue.trim())}
              disabled={!inputValue.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="h-[200px]">
            <div className="grid grid-cols-2 gap-2">
              {tags.map((tag) => (
                <Button
                  key={tag.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddTag(tag.name)}
                  disabled={isTagAlreadyAdded(tag.name)}
                  className={isTagAlreadyAdded(tag.name) ? "opacity-50" : ""}
                >
                  {tag.name}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default TagManager;