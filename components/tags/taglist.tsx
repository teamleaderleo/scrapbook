import React, { useState } from 'react';
import { useTags } from '@/app/lib/hooks/useTags';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, X, Plus } from "lucide-react";

interface TagListProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export function TagList({ selectedTags, onTagsChange }: TagListProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const { tagNames, addTag } = useTags();

  const handleSelectTag = async (tagName: string) => {
    if (!selectedTags.includes(tagName)) {
      const updatedTags = [...selectedTags, tagName];
      onTagsChange(updatedTags);
    }
    setOpen(false);
    setInputValue('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = selectedTags.filter(tag => tag !== tagToRemove);
    onTagsChange(updatedTags);
  };

  const handleCreateTag = async () => {
    if (inputValue.trim() && !tagNames.includes(inputValue.trim())) {
      const newTag = await addTag(inputValue.trim());
      handleSelectTag(newTag.name);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {selectedTags.map((tag) => (
          <Badge key={tag} variant="secondary">
            {tag}
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 h-4 w-4 p-0"
              onClick={() => handleRemoveTag(tag)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedTags.length > 0 ? `${selectedTags.length} selected` : "Select or create tags"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput 
              placeholder="Search or create tags..." 
              value={inputValue}
              onValueChange={setInputValue}
            />
            <CommandEmpty>
              <Button 
                onClick={handleCreateTag}
                className="w-full flex items-center justify-start px-2 py-1"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create "{inputValue}"
              </Button>
            </CommandEmpty>
            <CommandGroup>
              {tagNames
                .filter(tag => tag.toLowerCase().includes(inputValue.toLowerCase()) && !selectedTags.includes(tag))
                .map(tag => (
                  <CommandItem
                    key={tag}
                    onSelect={() => handleSelectTag(tag)}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        selectedTags.includes(tag) ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    {tag}
                  </CommandItem>
                ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}