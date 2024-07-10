'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TagManager } from "@/components/ui/tags/tagmanager";
import { Project } from '@/app/lib/definitions';

interface ChatArtifactProps {
  projects?: Project[];
  onSubmit: (data: ArtifactData) => void;
}

interface ContentItem {
  type: 'text' | 'file';
  content: string | File;
}

interface ArtifactData {
  name: string;
  contents: ContentItem[];
  tags: string[];
  associatedProjects: string[];
}

export default function ChatArtifact({ projects = [], onSubmit }: ChatArtifactProps) {
  const [name, setName] = useState('');
  const [contents, setContents] = useState<ContentItem[]>([{ type: 'text', content: '' }]);
  const [tags, setTags] = useState<string[]>([]);
  const [associatedProjects, setAssociatedProjects] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleContentChange = useCallback((index: number, value: string) => {
    setContents(prev => {
      const newContents = [...prev];
      newContents[index] = { ...newContents[index], content: value };
      return newContents;
    });
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>, index: number) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setContents(prev => [...prev, { type: 'text', content: '' }]);
    } else if (e.key === 'Backspace' && contents[index].content === '' && contents.length > 1) {
      e.preventDefault();
      setContents(prev => prev.filter((_, i) => i !== index));
    }
  }, [contents]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setContents(prev => [...prev, ...files.map(file => ({ type: 'file' as const, content: file }))]);
  }, []);

  const handleProjectToggle = useCallback((projectId: string) => {
    setAssociatedProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  }, []);

  const handleSubmit = useCallback(() => {
    const artifactData: ArtifactData = {
      name,
      contents,
      tags,
      associatedProjects,
    };
    onSubmit(artifactData);
  }, [name, contents, tags, associatedProjects, onSubmit]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>New Artifact</CardTitle>
        <CardDescription>Create a new artifact with multiple content items.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input
            placeholder="Artifact name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {contents.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              {item.type === 'text' ? (
                <textarea
                  value={item.content as string}
                  onChange={(e) => handleContentChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  placeholder="Share your thoughts, ideas, or updates..."
                  className="flex-1 min-h-[40px] p-2 border rounded resize-none"
                  rows={1}
                />
              ) : (
                <div className="flex-1 p-2 border rounded">
                  <p>{(item.content as File).name}</p>
                </div>
              )}
            </div>
          ))}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()}>
              <PaperclipIcon className="w-5 h-5" />
              <span className="sr-only">Attach file</span>
            </Button>
            <Input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileUpload}
              multiple
            />
          </div>
          <TagManager
            initialTags={tags}
            onTagsChange={setTags}
          />
          {projects.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Associated Projects:</h3>
              <div className="flex flex-wrap gap-2">
                {projects.map((project) => (
                  <Button
                    key={project.id}
                    variant={associatedProjects.includes(project.id) ? "default" : "outline"}
                    onClick={() => handleProjectToggle(project.id)}
                  >
                    {project.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline">Cancel</Button>
            <Button onClick={handleSubmit}>Create Artifact</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PaperclipIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}