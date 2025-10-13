"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/app/lib/db/supabase";
import { useParams, useRouter } from "next/navigation";
import { useItems } from "@/app/lib/contexts/item-context";
import { Button } from "@/components/ui/button";
import { MarkdownEditor } from "@/components/space/markdown-editor";
import { CodeEditor } from "@/components/space/code-editor";
import { RawJsonEditor } from "@/components/space/raw-json-editor";
import { ItemPreview } from "@/components/space/item-preview";

export default function EditItemPage() {
  const params = useParams();
  const router = useRouter();
  const { reload } = useItems();
  const [item, setItem] = useState<any>(null);
  const [content, setContent] = useState("");
  const [code, setCode] = useState("");
  const [rawInput, setRawInput] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [isEditingRaw, setIsEditingRaw] = useState(false);
  const [preview, setPreview] = useState<any>(null);

  useEffect(() => {
    loadItem();
  }, []);

  async function loadItem() {
    const { data } = await supabase
      .from('items')
      .select('*')
      .eq('id', params.id)
      .single();
    
    if (data) {
      setItem(data);
      setContent(data.content || '');
      setCode(data.code || '');
      setRawInput(JSON.stringify({
        id: data.id,
        title: data.title,
        url: data.url,
        tags: data.tags,
        category: data.category,
        content: data.content || '',
        code: data.code || '',
      }, null, 2));
    }
  }

  // Sync raw input changes to preview
  useEffect(() => {
    if (!isEditingRaw) return;
    
    try {
      const parsed = JSON.parse(rawInput);
      setPreview(parsed);
      setContent(parsed.content || '');
      setCode(parsed.code || '');
      setJsonError("");
    } catch (e) {
      setJsonError("Invalid JSON");
      setPreview(null);
    }
  }, [rawInput, isEditingRaw]);

  // Sync content/code changes to raw input
  useEffect(() => {
    if (isEditingRaw || !item) return;
    
    setRawInput(JSON.stringify({
      id: item.id,
      title: item.title,
      url: item.url,
      tags: item.tags,
      category: item.category,
      content: content,
      code: code,
    }, null, 2));
  }, [content, code, item, isEditingRaw]);

  async function handleSave() {
    const updates = preview ? {
      title: preview.title,
      url: preview.url || null,
      tags: preview.tags || [],
      category: preview.category || 'general',
      content: preview.content || '',
      code: preview.code || null,
      updated_at: new Date().toISOString()
    } : {
      content,
      code,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('items')
      .update(updates)
      .eq('id', params.id);
    
    if (!error) {
      await reload();
      router.push('/space');
    }
  }

  if (!item) return <div className="min-h-screen bg-background p-6 text-foreground">Loading...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto bg-background text-foreground">
      <div className="flex items-center gap-4 mb-4">
        <h1 className="text-2xl font-bold text-foreground">Edit: {item.title}</h1>
        <Button onClick={handleSave}>
          Save Changes
        </Button>
      </div>
      
      {/* Top Row: Editors */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <MarkdownEditor
          value={content}
          onChange={(val) => {
            setIsEditingRaw(false);
            setContent(val);
          }}
        />

        <CodeEditor
          value={code}
          onChange={(val) => {
            setIsEditingRaw(false);
            setCode(val);
          }}
        />
      </div>

      {/* Bottom Row: Raw & Preview */}
      <div className="grid grid-cols-2 gap-4">
        <RawJsonEditor
          value={rawInput}
          onChange={(val) => {
            setIsEditingRaw(true);
            setRawInput(val);
          }}
          error={jsonError}
        />

        <ItemPreview
          item={preview || item}
          content={content}
          code={code}
        />
      </div>
    </div>
  );
}