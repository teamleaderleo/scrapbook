'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useBlocks } from '@/app/lib/hooks/useBlocks';
import { Button } from "@/components/ui/button";
import { Trash2, Edit, Sun, Moon, Coffee, Briefcase } from 'lucide-react';
import { JSONContent } from '@tiptap/react';
import TiptapEditor, { TiptapEditorRef } from '@/components/projects/components/tiptap-editor-project-blocks';
import TagManager from './tag-manager'; 
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface ProjectBlocksProps {
  projectId: string;
}

interface Personality {
  name: string;
  icon: React.ReactNode;
}

const BLOCKS_PER_PAGE = 50;

const getPersonality = (date: Date): Personality => {
  const hour = date.getHours();
  if (hour >= 5 && hour < 9) return { name: 'Early Bird', icon: <Coffee className="w-4 h-4" /> };
  if (hour >= 9 && hour < 17) return { name: 'Work Mode', icon: <Briefcase className="w-4 h-4" /> };
  if (hour >= 17 && hour < 22) return { name: 'Evening Self', icon: <Sun className="w-4 h-4" /> };
  return { name: 'Night Owl', icon: <Moon className="w-4 h-4" /> };
};

const ProjectBlocks: React.FC<ProjectBlocksProps> = ({ projectId }) => {
  const { blocks, updateBlock, deleteBlock } = useBlocks();
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [visibleBlocks, setVisibleBlocks] = useState<number>(BLOCKS_PER_PAGE);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const editorRefs = useRef<{ [key: string]: TiptapEditorRef }>({});

  const projectBlocks = useMemo(() => 
    blocks
      ?.filter(block => block.projects.some(project => project.id === projectId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [],
    [blocks, projectId]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      bottomRef.current?.scrollIntoView({ behavior: 'auto' });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleBlocks < projectBlocks.length) {
          setVisibleBlocks(prev => Math.min(prev + BLOCKS_PER_PAGE, projectBlocks.length));
        }
      },
      { root: containerRef.current, threshold: 0.1 }
    );

    if (containerRef.current?.firstElementChild) {
      observer.observe(containerRef.current.firstElementChild);
    }

    return () => observer.disconnect();
  }, [visibleBlocks, projectBlocks.length]);

  const handleEditBlock = useCallback((blockId: string) => {
    setEditingBlockId(blockId);
    setTimeout(() => {
      editorRefs.current[blockId]?.focus();
    }, 0);
  }, []);

  const handleSaveBlock = useCallback((blockId: string, content: JSONContent) => {
    updateBlock({ id: blockId, data: content });
    setEditingBlockId(null);
  }, [updateBlock]);

  const handleCancelEdit = useCallback(() => {
    setEditingBlockId(null);
  }, []);

  const handleDeleteBlock = useCallback((blockId: string) => {
    deleteBlock(blockId);
  }, [deleteBlock]);

  const renderBlock = useCallback((block: typeof projectBlocks[number]) => {
    const isEditing = editingBlockId === block.id;
    const createdDate = new Date(block.createdAt);
    const personality = getPersonality(createdDate);

    return (
      <div
        key={block.id}
        className="px-4 py-2 hover:bg-[#32353b] transition-colors duration-200 group relative"
      >
        <div className="flex items-center mb-1">
          <div className="font-semibold mr-2 text-white flex items-center">
            {personality.icon}
            <span className="ml-2">{personality.name}</span>
          </div>
          <div className="text-xs text-[#72767d]">
            {createdDate.toLocaleString()}
          </div>
        </div>
        <TiptapEditor
          ref={(el) => {
            if (el) editorRefs.current[block.id] = el;
          }}
          content={block.content as JSONContent}
          editable={isEditing}
          onSave={(content) => handleSaveBlock(block.id, content)}
          onCancel={handleCancelEdit}
        />
        <div className="mt-2">
          <TagManager blockId={block.id} showOnHover={true} />
        </div>
        {!isEditing && (
          <TooltipProvider delayDuration={0}>
            <div className="absolute top-2 right-7 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="flex items-center bg-[#2f3136] rounded overflow-hidden">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <TagManager blockId={block.id} showOnHover={false} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Add Tag</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      onClick={() => handleEditBlock(block.id)}
                      className="text-[#b9bbbe] hover:text-white hover:bg-[#3f4248] rounded-none h-10 w-10 p-0"
                    >
                      <Edit className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Edit Block</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      onClick={() => handleDeleteBlock(block.id)}
                      className="text-[#b9bbbe] hover:text-[#ed4245] hover:bg-[#3f4248] rounded-none h-10 w-10 p-0"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Delete Block</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </TooltipProvider>
        )}
      </div>
    );
  }, [editingBlockId, handleEditBlock, handleDeleteBlock, handleSaveBlock, handleCancelEdit]);

  const renderContent = () => {
    if (isLoading) {
      return <div className="flex items-center justify-center h-full text-[#dcddde]">Loading blocks...</div>;
    }

    if (projectBlocks.length === 0) {
      return <div className="flex items-center justify-center h-full text-[#dcddde]">No blocks found for this project.</div>;
    }

    const blocksToRender = projectBlocks.slice(0, visibleBlocks);

    return (
      <div className="flex flex-col-reverse">
        <div ref={bottomRef} />
        {blocksToRender.map(renderBlock)}
      </div>
    );
  };

  return (
    <div ref={containerRef} className="h-full bg-[#36393f] text-[#dcddde] overflow-y-auto flex flex-col-reverse">
      {renderContent()}
    </div>
  );
};

export default React.memo(ProjectBlocks);