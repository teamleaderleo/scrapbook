import React, { useState } from 'react';
import { useTags } from '@/app/lib/hooks/useTags';
import { Tag } from '@/app/lib/definitions/definitions';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, X } from "lucide-react";

interface TagManagerProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  allTags: string[];
}

export function TagManager({ selectedTags, onTagsChange, allTags }: TagManagerProps) {
  const { addTag } = useTags();
  const [newTag, setNewTag] = useState('');
  const [open, setOpen] = useState(false);

  const handleAddTag = async () => {
    const trimmedTag = newTag.trim().toLowerCase();
    if (trimmedTag && !selectedTags.includes(trimmedTag)) {
      const createdTag = await addTag(trimmedTag);
      const updatedTags = [...selectedTags, createdTag.name];
      onTagsChange(updatedTags);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = selectedTags.filter(tag => tag !== tagToRemove);
    onTagsChange(updatedTags);
  };

  const handleSelectTag = (tagName: string) => {
    if (!selectedTags.includes(tagName)) {
      onTagsChange([...selectedTags, tagName]);
    }
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <Input
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          placeholder="Add a new tag"
          className="flex-grow"
        />
        <Button onClick={handleAddTag}>Add</Button>
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            Select tags
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search tags..." />
            <CommandEmpty>No tag found.</CommandEmpty>
            <CommandGroup>
              {allTags
                .filter(tag => !selectedTags.includes(tag))
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
    </div>
  );
}