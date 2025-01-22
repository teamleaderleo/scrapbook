'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Expand, Shrink } from 'lucide-react';
import ScrapbookEntry from './scrapbook-entry';

const SCRAPBOOK_DATA = [
  {
    id: 'platform',
    text: "• Built experimental full-stack platform for prototyping developer experience improvements, featuring optimized CRUD operations and specialized tooling implementations.",
    attachments: {
    images: [{
      src: '/scrapbook/platform-vscode-overview.webp',
      alt: 'VSCode project structure showing full-stack architecture'
    }]
  }
  },
  {
    id: 'blog',
    text: "• Built personal blog CMS where I write about software development.",
    attachments: {
      images: [{
        src: '/scrapbook/blog-landing-preview.webp',
        alt: 'Preview of Stensibly blog landing page'
      }]
    }
  },
  {
    id: 'server-components',
    text: "• Built scalable architecture for interactive features using React Server Components.",
    attachments: {
      images: [{
        src: '/scrapbook/server-actions-example.webp',
        alt: 'Example of Server Actions implementation'
      }],
      code: [{
        title: 'Server Action Implementation',
        content: `export async function createBlock(accountId: string, dataString: string): Promise<BlockState> {
          try {
            const data = JSON.parse(dataString) as JSONContent;
            const newBlockId = uuid();
            const now = new Date();
            
            const [newBlock] = await db.insert(blocks).values({
              id: newBlockId,
              accountId,
              content: data,
              createdAt: now,
              updatedAt: now
            }).returning();
        
            return { message: 'Block created successfully', blockId: newBlock.id, success: true };
          } catch (error: any) {
            console.error('Error creating block:', error);
            return { message: \`Failed to create block: \${error.message}\`, success: false };
          }
        }`
      }]
    }
  },
  {
    id: 'tiptap',
    text: "• Implemented rich text editing system with TipTap, featuring Discord-like message caching and preview states.",
    attachments: {
      images: [{
        src: '/scrapbook/tiptap-editor-demo.webp',
        alt: 'TipTap rich text editor with preview state'
      }],
      code: [{
        title: 'TipTap Configuration',
        content: `      handleKeyDown: (view, event) => {
        if (!editorRef.current || isTagManagerActive) return false;

        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          onSave(editorRef.current.getJSON());
          return true;
        }
        if (event.key === 'Escape') {
          event.preventDefault();
          editorRef.current.commands.setContent(originalContent);
          onCancel();
          return true;
        }
        return false;
      },`
      }],
    }
  },
  {
    id: 'performance',
    text: "• Reduced GET request latency from 300ms to 50ms through optimized queries and TanStack Query caching.",
    attachments: {
      images: [{
        src: '/scrapbook/network-performance-diff.webp',
        alt: 'Network tab showing improved request times'
      }],
      code: [{
        title: 'TanStack Query Caching',
        content: `const { data: projects, isLoading, error } = useQuery<ProjectWithBlocksWithTags[], Error>({
                  queryKey: ['projects', ADMIN_UUID],
                  queryFn: async () => {
                    const fetchedProjects = await getCachedProjectsWithBlocksWithTags(ADMIN_UUID);
                    return fetchedProjects;
                  },
                  staleTime: Infinity,
                  gcTime: Infinity,
                });`
      }],
    }
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