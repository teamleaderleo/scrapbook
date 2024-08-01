import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BlockWithRelations, ProjectFormSubmission, ProjectFormSubmissionSchema, ProjectWithBlocks, ProjectWithExtendedBlocks } from "@/app/lib/definitions/definitions";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { TagManager } from '@/components/tags/tagmanager';
import { Suggestions } from '@/components/suggestions/suggestions';
import { useTags } from '@/app/lib/hooks/useTags';
import { TiptapPreview } from '@/components/editor/content-preview';

interface ProjectFormProps {
  project: ProjectWithBlocks;
  blocks: BlockWithRelations[];
  onSubmit: (formData: ProjectFormSubmission) => void;
  isSubmitting: boolean;
  submitButtonText: string;
  cancelHref: string;
  suggestedTags?: string[];
  onGetAISuggestions?: () => void;
}

export function ProjectForm({
  project,
  blocks,
  onSubmit,
  isSubmitting,
  submitButtonText,
  cancelHref,
  suggestedTags = [],
  onGetAISuggestions,
}: ProjectFormProps) {
  const { tagNames } = useTags();
  const form = useForm<ProjectFormSubmission>({
    resolver: zodResolver(ProjectFormSubmissionSchema),
    defaultValues: {
      name: project.name,
      description: project.description || '',
      status: project.status as "pending" | "completed",
      blocks: project.blocks.map(block => block.id),
      tags: project.tags.map(tag => tag.name),
    },
  });

  const handleSubmit = (data: ProjectFormSubmission) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter project name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter project description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="blocks"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Associated Blocks</FormLabel>
                <FormDescription>
                  Select the blocks associated with this project
                </FormDescription>
              </div>
              {blocks.map((block) => (
                <FormField
                  key={block.id}
                  control={form.control}
                  name="blocks"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={block.id}
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(block.id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, block.id])
                                : field.onChange(
                                    field.value?.filter(
                                      (value) => value !== block.id
                                    )
                                  )
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          <TiptapPreview content={block.content} maxLength={50} />
                        </FormLabel>
                      </FormItem>
                    )
                  }}
                />
              ))}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <FormControl>
                <TagManager
                  selectedTags={field.value}
                  onTagsChange={field.onChange}
                  allTags={tagNames}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Suggestions
          suggestedTags={suggestedTags}
          onAddTag={(tag) => form.setValue('tags', [...form.getValues('tags'), tag])}
        />

        <div className="flex justify-between">
          {onGetAISuggestions && (
            <Button type="button" onClick={onGetAISuggestions}>
              Get AI Suggestions
            </Button>
          )}
          <div className="space-x-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : submitButtonText}
            </Button>
            <Button variant="outline" asChild>
              <Link href={cancelHref}>Cancel</Link>
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}