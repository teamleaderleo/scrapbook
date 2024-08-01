import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { TagManager } from '@/components/tags/tagmanager';
import { BlockWithRelations, BaseProject } from "@/app/lib/definitions/definitions";
import Link from 'next/link';

// Define the form schema
const formSchema = z.object({
  content: z.any(), // This will be the Tiptap JSON content
  tags: z.array(z.string()),
  projects: z.array(z.string()),
});

type BlockFormProps = {
  block?: BlockWithRelations;
  projects: BaseProject[];
  onSubmit: (data: z.infer<typeof formSchema>) => void;
  isSubmitting: boolean;
  submitButtonText: string;
  cancelHref: string;
  allTags: string[]; // All available tags
};

export function BlockForm({ 
  block, 
  projects, 
  onSubmit, 
  isSubmitting, 
  submitButtonText, 
  cancelHref,
  allTags
}: BlockFormProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>(block?.tags.map(t => t.name) || []);
  const [primaryTag, setPrimaryTag] = useState<string | null>(null);

  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: block?.content || {},
      tags: selectedTags,
      projects: block?.projects.map(p => p.id) || [],
    },
  });

  // Initialize Tiptap editor
  const editor = useEditor({
    extensions: [StarterKit],
    content: block?.content || '',
    onUpdate: ({ editor }) => {
      form.setValue('content', editor.getJSON());
    },
  });

  // Effect to set primary tag
  useEffect(() => {
    if (selectedTags.length > 0 && !primaryTag) {
      setPrimaryTag(selectedTags[0]);
    }
  }, [selectedTags, primaryTag]);

  // Handle form submission
  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    const firstParagraph = editor?.getJSON().content?.[0]?.content?.[0]?.text || '';
    const label = primaryTag || firstParagraph.slice(0, 50); // Use primary tag or first 50 chars of content

    onSubmit({
      ...values,
      tags: selectedTags,
      // label,
    });
  };

  // Handle tag selection
  const handleTagsChange = (newTags: string[]) => {
    setSelectedTags(newTags);
    if (!newTags.includes(primaryTag || '')) {
      setPrimaryTag(newTags[0] || null);
    }
  };

  // Handle primary tag selection
  const handlePrimaryTagChange = (tag: string) => {
    setPrimaryTag(tag);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="content"
          render={() => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <EditorContent editor={editor} className="border p-2 rounded-md min-h-[200px]" />
              </FormControl>
              <FormDescription>Enter the block content using the rich text editor.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tags"
          render={() => (
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <FormControl>
                <TagManager
                  selectedTags={selectedTags}
                  onTagsChange={handleTagsChange}
                  allTags={allTags}
                  // primaryTag={primaryTag}
                  // onPrimaryTagChange={handlePrimaryTagChange}
                />
              </FormControl>
              <FormDescription>Select or create tags for this block. The primary tag (if set) will be used as the block&apos;s label.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="projects"
          render={() => (
            <FormItem>
              <FormLabel>Associated Projects</FormLabel>
              <div className="space-y-2">
                {projects.map((project) => (
                  <div key={project.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`project-${project.id}`}
                      {...form.register('projects')}
                      value={project.id}
                      defaultChecked={block?.projects.some(p => p.id === project.id)}
                    />
                    <label htmlFor={`project-${project.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {project.name}
                    </label>
                  </div>
                ))}
              </div>
              <FormDescription>Select the projects associated with this block.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Link
            href={cancelHref}
            className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
          >
            Cancel
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : submitButtonText}
          </Button>
        </div>
      </form>
    </Form>
  );
}