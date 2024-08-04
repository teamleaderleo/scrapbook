'use client';

import React, { useState, useCallback } from 'react';
import { useBlocks } from '@/app/lib/hooks/useBlocks';
import { Virtuoso } from 'react-virtuoso';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Edit } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

interface ProjectBlocksProps {
  projectId: string;
}

const ProjectBlocks: React.FC<ProjectBlocksProps> = ({ projectId }) => {
  const { blocks, updateBlock, deleteBlock } = useBlocks();
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    editable: true,
    immediatelyRender: false,
  });

  const readOnlyEditor = useEditor({
    extensions: [StarterKit],
    editable: false,
    immediatelyRender: false,
  });

  const projectBlocks = blocks?.filter(block => 
    block.projects.some(project => project.id === projectId)
  ) || [];

  const handleEditBlock = (blockId: string, content: any) => {
    setEditingBlockId(blockId);
    editor?.commands.setContent(content);
  };

  const handleSaveBlock = () => {
    if (editingBlockId && editor) {
      updateBlock({ id: editingBlockId, data: editor.getJSON() });
      setEditingBlockId(null);
    }
  };

  const handleDeleteBlock = (blockId: string) => {
    deleteBlock(blockId);
  };

  const BlockContent = useCallback(({ content }: { content: any }) => {
    React.useEffect(() => {
      readOnlyEditor?.commands.setContent(content);
    }, [content]);

    return <EditorContent editor={readOnlyEditor} />;
  }, [readOnlyEditor]);

  if (projectBlocks.length === 0) {
    return <div>No blocks found for this project.</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <Virtuoso
        className="flex-grow"
        data={projectBlocks}
        itemContent={(index, block) => (
          <Card key={block.id} className="mb-4">
            <CardContent className="p-4">
              {editingBlockId === block.id ? (
                <>
                  <EditorContent editor={editor} />
                  <Button onClick={handleSaveBlock} className="mt-2">Save</Button>
                </>
              ) : (
                <>
                  <BlockContent content={block.content} />
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditBlock(block.id, block.content)}
                      className="mr-2"
                    >
                      <Edit className="w-4 h-4 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteBlock(block.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Delete
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      />
    </div>
  );
};

export default ProjectBlocks;