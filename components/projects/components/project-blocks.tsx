'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useBlocks } from '@/app/lib/hooks/useBlocks';
import { Button } from "@/components/ui/button";
import { Trash2, Edit } from 'lucide-react';
import { JSONContent } from '@tiptap/react';
import TiptapEditor from './tiptap-editor';

interface ProjectBlocksProps {
  projectId: string;
}

const BLOCKS_PER_PAGE = 50;

const ProjectBlocks: React.FC<ProjectBlocksProps> = ({ projectId }) => {
  const { blocks, updateBlock, deleteBlock } = useBlocks();
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [visibleBlocks, setVisibleBlocks] = useState<number>(BLOCKS_PER_PAGE);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

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

  const renderBlock = useCallback((block: typeof projectBlocks[number]) => (
    <div
      key={block.id}
      className="px-4 py-2 hover:bg-[#32353b] transition-colors duration-200 group relative"
    >
      <div className="flex items-center mb-1">
        <div className="font-semibold mr-2 text-white">{block.createdBy || 'Anonymous'}</div>
        <div className="text-xs text-[#72767d]">
          {new Date(block.createdAt).toLocaleString()}
        </div>
      </div>
      <TiptapEditor
        content={block.content as JSONContent}
        editable={editingBlockId === block.id}
        onSave={(content) => handleSaveBlock(block.id, content)}
        onCancel={handleCancelEdit}
      />
      {editingBlockId !== block.id && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditBlock(block.id)}
            className="mr-2 text-[#b9bbbe] hover:text-white"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteBlock(block.id)}
            className="text-[#b9bbbe] hover:text-[#ed4245]"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  ), [editingBlockId, handleEditBlock, handleDeleteBlock, handleSaveBlock, handleCancelEdit]);

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