// import React, { useState, useMemo } from 'react';
// import { useTags } from '@/app/lib/hooks/useTags';
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// import { Check, ChevronsUpDown, X, Plus } from "lucide-react";
// import { Tag } from '@/app/lib/definitions/definitions';

// interface TagListProps {
//   selectedTags: Tag[];
//   onTagsChange: (tags: Tag[]) => void;
// }

// export function TagList({ selectedTags, onTagsChange }: TagListProps) {
//   const [open, setOpen] = useState(false);
//   const [inputValue, setInputValue] = useState('');
//   const { tags, addTag, isLoading, error } = useTags();

//   const handleCreateTag = async () => {
//     if (inputValue.trim()) {
//       const newTag = await addTag(inputValue.trim());
//       handleSelectTag(newTag);
//     }
//   };

//   const handleSelectTag = async (tag: Tag) => {
//     if (!selectedTags.some(t => t.id === tag.id)) {
//       const updatedTags = [...selectedTags, tag];
//       onTagsChange(updatedTags);
//     }
//     setOpen(false);
//     setInputValue('');
//   };

//   const handleRemoveTag = (tagToRemove: Tag) => {
//     const updatedTags = selectedTags.filter(tag => tag.id !== tagToRemove.id);
//     onTagsChange(updatedTags);
//   };

//   const availableTags = useMemo(() => {
//     if (!tags) return [];
//     return tags.filter(tag => !selectedTags.some(selectedTag => selectedTag.id === tag.id));
//   }, [tags, selectedTags]);

//   if (isLoading) {
//     return <div>Loading tags...</div>;
//   }

//   if (error) {
//     return <div>Error loading tags: {error.message}</div>;
//   }

//   return (
//     <div className="space-y-2">
//       <div className="flex flex-wrap gap-2">
//         {selectedTags.map((tag) => (
//           <Badge key={tag.id} variant="secondary">
//             {tag.name}
//             <Button
//               variant="ghost"
//               size="sm"
//               className="ml-2 h-4 w-4 p-0"
//               onClick={() => handleRemoveTag(tag)}
//             >
//               <X className="h-3 w-3" />
//             </Button>
//           </Badge>
//         ))}
//       </div>
//       <Popover open={open} onOpenChange={setOpen}>
//         <PopoverTrigger asChild>
//           <Button
//             variant="outline"
//             role="combobox"
//             aria-expanded={open}
//             className="w-full justify-between"
//           >
//             {selectedTags.length > 0 ? `${selectedTags.length} selected` : "Select or create tags"}
//             <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//           </Button>
//         </PopoverTrigger>
//         <PopoverContent className="w-full p-0">
//           <Command>
//             <CommandInput 
//               placeholder="Search or create tags..." 
//               value={inputValue}
//               onValueChange={setInputValue}
//             />
//             <CommandList>
//               <CommandEmpty>
//                 <Button 
//                   onClick={handleCreateTag}
//                   className="w-full flex items-center justify-start px-2 py-1"
//                 >
//                   <Plus className="mr-2 h-4 w-4" />
//                   Create &quot;{inputValue}&quot;
//                 </Button>
//               </CommandEmpty>
//               <CommandGroup>
//                 {availableTags.map(tag => (
//                   <CommandItem
//                     key={tag.id}
//                     onSelect={() => handleSelectTag(tag)}
//                   >
//                     <Check
//                       className={`mr-2 h-4 w-4 opacity-0`}
//                     />
//                     {tag.name}
//                   </CommandItem>
//                 ))}
//               </CommandGroup>
//             </CommandList>
//           </Command>
//         </PopoverContent>
//       </Popover>
//     </div>
//   );
// }