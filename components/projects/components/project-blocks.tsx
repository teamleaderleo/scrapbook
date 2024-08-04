'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useBlocks } from '@/app/lib/hooks/useBlocks';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { Button } from "@/components/ui/button";
import { Trash2, Edit } from 'lucide-react';
import { JSONContent } from '@tiptap/react';
import TiptapEditor from './tiptap-editor';

interface ProjectBlocksProps {
  projectId: string;
}

const ProjectBlocks: React.FC<ProjectBlocksProps> = ({ projectId }) => {
  const { blocks, updateBlock, deleteBlock } = useBlocks();
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  const projectBlocks = useMemo(() => 
    blocks
      ?.filter(block => block.projects.some(project => project.id === projectId))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) || [],
    [blocks, projectId]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      // Scroll to bottom after loading
      setTimeout(() => virtuosoRef.current?.scrollToIndex({ index: projectBlocks.length - 1, behavior: 'smooth' }), 0);
    }, 100);
    return () => clearTimeout(timer);
  }, [projectBlocks.length]);

  const handleEditBlock = useCallback((blockId: string) => {
    setEditingBlockId(blockId);
  }, []);

  const handleSaveBlock = useCallback((blockId: string, content: JSONContent) => {
    updateBlock({ id: blockId, data: content });
    setEditingBlockId(null);
  }, [updateBlock]);

  const handleDeleteBlock = useCallback((blockId: string) => {
    deleteBlock(blockId);
  }, [deleteBlock]);

  const renderBlock = useCallback((_: number, block: typeof projectBlocks[number]) => (
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
      />
      {editingBlockId === block.id ? (
        <Button 
          onClick={() => setEditingBlockId(null)}
          className="mt-2 bg-[#4f545c] hover:bg-[#5d6269] text-white"
        >
          Cancel
        </Button>
      ) : (
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
  ), [editingBlockId, handleEditBlock, handleDeleteBlock, handleSaveBlock]);

  const renderContent = () => {
    if (isLoading) {
      return <div className="flex items-center justify-center h-full text-[#dcddde]">Loading blocks...</div>;
    }

    if (projectBlocks.length === 0) {
      return <div className="flex items-center justify-center h-full text-[#dcddde]">No blocks found for this project.</div>;
    }

    return (
      <Virtuoso
        ref={virtuosoRef}
        style={{ height: '100%' }}
        data={projectBlocks}
        itemContent={renderBlock}
        initialTopMostItemIndex={projectBlocks.length - 1}
        followOutput={false}
        overscan={200}
        increaseViewportBy={{ top: 600, bottom: 600 }}
        components={{
          Footer: () => <div style={{ height: 20 }} />,
        }}
      />
    );
  };

  return (
    <div className="h-full bg-[#36393f] text-[#dcddde]">
      {renderContent()}
    </div>
  );
};

export default React.memo(ProjectBlocks);