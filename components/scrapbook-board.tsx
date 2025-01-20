'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Expand, Shrink } from 'lucide-react';
import ScrapbookEntry from './scrapbook-entry';

const SCRAPBOOK_DATA = [
  {
    id: 'platform',
    text: "• Built experimental full-stack platform for prototyping developer experience improvements, featuring optimized CRUD operations and specialized tooling implementations.",
  },
  {
    id: 'server-components',
    text: "• Built scalable architecture for interactive features using React Server Components."
  },
  {
    id: 'tiptap',
    text: "• Implemented rich text editing system with TipTap, featuring Discord-like message caching and preview states.",
    attachments: {
      code: [{
        title: 'TipTap Configuration',
        content: `const editor = useEditor({
  extensions: [StarterKit],
  content: initialContent,
  onUpdate: ({ editor }) => {
    messageCache.set(id, editor.getHTML());
    setPreview(editor.getHTML());
  },
});`
      }],
      images: [{
        src: '/api/placeholder/400/300',
        alt: 'TipTap Editor Interface'
      }]
    }
  },
  {
    id: 'performance',
    text: "• Reduced GET request latency from 300ms to 50ms through optimized queries and TanStack Query caching.",
  },
  {
    id: 'websockets',
    text: "• Implemented real-time WebSocket telemetry with resilient error handling for system monitoring and analytics.",
  },
  {
    id: 'microservice',
    text: "• Built and deployed RESTful Go image compression microservice using Docker, AWS Lambda and API Gateway.",
  },
  {
    id: 'zod',
    text: "• Implemented robust data handling with Zod-enforced schema validation, ensuring end-to-end type safety for JSON data across client-server boundaries.",
  },
  {
    id: 'claude',
    text: "• Integrated Claude's LLM API for intelligent tag suggestions and content organization.",
  },
  {
    id: 'database',
    text: "• Migrated database from Vercel to Supabase with Drizzle ORM, ensuring complete data preservation.",
  },
  {
    id: 'auth',
    text: "• Implemented NextAuth.js authentication (Google, GitHub, email) and AWS S3 file storage.",
  },
  {
    id: 'ui',
    text: "• Built responsive UI using Tailwind CSS and shadcn/ui with optimized rendering and pagination.",
  },
  {
    id: 'quality',
    text: "• Maintained code quality through regular reviews and refactoring, with Figma-driven UI/UX design cycles.",
  }
];

const ScrapbookBoard = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-8">
        <h2 className="text-lg font-semibold text-gray-800">Scrapbook</h2>
        <Button
          variant={isExpanded ? "default" : "outline"}
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2"
        >
          {isExpanded ? (
            <>
              <Shrink className="w-4 h-4" />
              Contract!
            </>
          ) : (
            <>
              <Expand className="w-4 h-4" />
              Expand!
            </>
          )}
        </Button>
      </div>

      <div 
        className={`
          grid gap-4 transition-all duration-300
          ${isExpanded 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            : 'grid-cols-1'
          }
        `}
      >
        {SCRAPBOOK_DATA.map((item) => (
          <div key={item.id} className="w-80">
            <ScrapbookEntry 
              item={item} 
              isGridLayout={isExpanded}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScrapbookBoard;