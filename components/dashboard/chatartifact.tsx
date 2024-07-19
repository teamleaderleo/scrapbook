'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ArtifactData {
  text: string;
  images: File[];
  tags: string[];
}

export default function ChatArtifact() {
  const [text, setText] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textInputRef.current) {
      textInputRef.current.style.height = 'auto';
      textInputRef.current.style.height = `${textInputRef.current.scrollHeight}px`;
    }
  }, [text]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    processTags(e.target.value);
  };

  const processTags = (input: string) => {
    const tagRegex = /#(\w+)/g;
    const foundTags = input.match(tagRegex)?.map(tag => tag.slice(1)) || [];
    setTags([...new Set(foundTags)]);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newImages = Array.from(e.target.files || []);
    setImages(prevImages => [...prevImages, ...newImages]);
  };

  const handleSubmit = () => {
    const artifactData: ArtifactData = { text, images, tags };
    console.log(artifactData);
    // Here you would typically send the data to your server
    setText('');
    setImages([]);
    setTags([]);
  };

  return (
    <Card className="fixed bottom-0 left-0 right-0 z-10 border-t-2 border-gray-200">
      <CardContent className="p-4">
        <div className="flex items-end space-x-2">
          <div className="flex-grow">
            <textarea
              ref={textInputRef}
              value={text}
              onChange={handleTextChange}
              placeholder="Share your thoughts, ideas, or updates... Use # for tags"
              className="w-full resize-none overflow-hidden border border-gray-300 rounded-md p-2 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              style={{ minHeight: '2.5rem', maxHeight: '10rem' }}
              rows={1}
            />
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span key={index} className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} className="h-10 w-10">
              <PaperclipIcon className="w-5 h-5" />
              <span className="sr-only">Attach image</span>
            </Button>
            <Button onClick={handleSubmit} className="h-10">Send</Button>
          </div>
        </div>
        <input
          onInput={handleImageUpload}
          title="Upload Image"
          placeholder="Upload Image"
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleImageUpload}
          multiple
          accept="image/*"
        />
        {images.length > 0 && (
          <div className="mt-2 text-sm text-gray-500">
            {images.length} image{images.length > 1 ? 's' : ''} attached
          </div>
        )}
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