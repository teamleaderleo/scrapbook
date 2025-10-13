"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useItems } from "@/app/lib/contexts/item-context";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { CodeDisplay } from "./code-display";
import { SpaceHeader } from "./space-header";
import { addItemAction } from '@/app/space/actions';

export function AddItemFormContent() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const duplicateId = searchParams.get('duplicate');
  
  const [input, setInput] = useState(`{
  "id": "unique-slug",
  "title": "0. Problem Title",
  "url": "https://leetcode.com/problems/...",
  "tags": ["type:leetcode", "company:google", "topic:array", "difficulty:easy"],
  "category": "leetcode",
  "content": "# Approach\\n\\nYour writeup here",
  "code": "def solution():\\n  # code\\n"
}`);
  const [preview, setPreview] = useState<any>(null);
  const [error, setError] = useState("");

  // Load duplicate item if requested
  // TODO: maybe should move to server action
  useEffect(() => {
    if (duplicateId) {
      loadDuplicate(duplicateId);
    }
  }, [duplicateId]);

  async function loadDuplicate(id: string) {
    const { data } = await supabase
      .from('items')
      .select('*')
      .eq('id', id)
      .single();
    
    if (data) {
      const template = {
        id: `${data.id}-copy`,
        title: `${data.title} (Copy)`,
        url: data.url,
        tags: data.tags,
        category: data.category,
        content: data.content,
        code: data.code,
      };
      setInput(JSON.stringify(template, null, 2));
    }
  }

  // Auto-preview whenever input changes
  useEffect(() => {
    try {
      const parsed = JSON.parse(input);
      setPreview(parsed);
      setError("");
    } catch (e) {
      setError("Invalid JSON");
      setPreview(null);
    }
  }, [input]);

  const handleSave = async () => {
    if (!preview) return;
    try {
      await addItemAction(preview);   // server does insert + revalidate
      router.refresh();
      router.push('/space');          
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SpaceHeader 
        leftContent="Add Item"
        centerContent={
          <Button 
            onClick={handleSave} 
            size="sm" 
            disabled={!preview}
            className="bg-accent text-accent-foreground"
          >
            Save Item
          </Button>
        }
      />
      
      <div className="p-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-2 gap-4">
          {/* Input */}
          <div>
            <h2 className="text-sm font-semibold mb-2 text-foreground">JSON</h2>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full h-96 p-3 rounded font-mono text-sm
                bg-white dark:bg-sidebar
                border border-border dark:border-sidebar-border
                text-foreground dark:text-sidebar-foreground
                placeholder:text-muted-foreground
                focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Auto Preview */}
          <div>
            <h2 className="text-sm font-semibold mb-2 text-foreground">Preview</h2>
            {error && <div className="text-red-600 dark:text-red-400 mb-2">{error}</div>}
            {preview && (
              <div className="rounded p-4 space-y-2
                bg-white dark:bg-sidebar
                border border-border dark:border-sidebar-border
                text-foreground dark:text-sidebar-foreground">
                <div><strong>Title:</strong> {preview.title}</div>
                <div><strong>Tags:</strong> {preview.tags?.join(', ')}</div>
                <div><strong>Category:</strong> {preview.category}</div>
                {preview.url && <div><strong>URL:</strong> {preview.url}</div>}
                <div className="border-t border-border dark:border-sidebar-border pt-2 mt-2">
                  <strong>Content:</strong>
                  <pre className="text-xs mt-1 whitespace-pre-wrap text-foreground dark:text-sidebar-foreground">
                    {preview.content}
                  </pre>
                </div>
                {preview.code && <CodeDisplay code={preview.code} />}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AddItemForm() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <SpaceHeader leftContent="Loading..." />
        <div className="p-6 text-foreground">Loading...</div>
      </div>
    }>
      <AddItemFormContent />
    </Suspense>
  );
}