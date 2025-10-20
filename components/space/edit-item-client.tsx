"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useItems } from "@/app/lib/contexts/item-context";
import { Button } from "@/components/ui/button";
import { MarkdownEditor } from "@/components/space/markdown-editor";
import { CodeEditor } from "@/components/space/code-editor";
import { RawJsonEditor } from "@/components/space/raw-json-editor";
import { ItemPreview } from "@/components/space/item-preview";
import { SpaceHeader } from "@/components/space/space-header";
import { updateItemAction } from '@/app/space/actions';
import { Copy, Check } from "lucide-react";

interface EditItemClientProps {
  item: any; // Item from context or server
}

export function EditItemClient({ item }: EditItemClientProps) {
  const router = useRouter();
  
  const [content, setContent] = useState(item.content || '');
  const [code, setCode] = useState(item.code || '');
  const [rawInput, setRawInput] = useState(
    JSON.stringify({
      id: item.id,
      title: item.title,
      url: item.url,
      tags: item.tags,
      category: item.category,
      content: item.content || '',
      code: item.code || '',
    }, null, 2)
  );
  const [jsonError, setJsonError] = useState("");
  const [isEditingRaw, setIsEditingRaw] = useState(false);
  const [preview, setPreview] = useState<any>(null);

  // small UX: feedback when copying em dash
  const [copiedDash, setCopiedDash] = useState(false);

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
    if (isEditingRaw) return;
    
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
    const updates = preview
      ? {
          title: preview.title,
          url: preview.url ?? null,
          tags: preview.tags ?? [],
          category: preview.category ?? 'general',
          content: preview.content ?? '',
          code: preview.code ?? null,
        }
      : {
          content,
          code,
        };

    try {
      await updateItemAction(item.id, updates); // server update + revalidate
      router.refresh();
      router.push('/space');                    // list is fresh now
    } catch (e) {
      // handle error (toast, etc.)
    }
  }

  const copyEmDash = async () => {
    await navigator.clipboard.writeText("—");
    setCopiedDash(true);
    setTimeout(() => setCopiedDash(false), 1500);
  };

  return (
    <div className="min-h-screen bg-background">
      <SpaceHeader 
        leftContent={`Edit: ${item.title}`}
        centerContent={
          <Button 
            onClick={handleSave} 
            size="sm"
            className="bg-accent text-accent-foreground"
          >
            Save Changes
          </Button>
        }
      />
      
      <div className="p-6 max-w-7xl mx-auto">
        {/* Top Row: Editors */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Left: Content (Markdown) with copy em dash button */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-foreground">
                Content (Markdown)
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={copyEmDash}
                title="Copy em dash (—)"
              >
                {copiedDash ? <Check className="h-3 w-3" /> : <><Copy className="h-3 w-3 mr-1" /> —</>}
              </Button>
            </div>

            <MarkdownEditor
              value={content}
              onChange={(val) => {
                setIsEditingRaw(false);
                setContent(val);
              }}
            />
          </div>

          {/* Right: Code editor */}
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
    </div>
  );
}
