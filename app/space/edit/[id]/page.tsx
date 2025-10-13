"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/app/lib/db/supabase";
import { useParams, useRouter } from "next/navigation";
import { useItems } from "@/app/lib/contexts/item-context";
import { Button } from "@/components/ui/button";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from "next-themes";
import { CodeDisplay } from "@/components/space/code-display";

export default function EditItemPage() {
  const params = useParams();
  const router = useRouter();
  const { reload } = useItems();
  const { theme } = useTheme();
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
        <div>
          <h2 className="text-sm font-semibold mb-2 text-foreground">Content (Markdown)</h2>
          <textarea
            value={content}
            onChange={(e) => {
              setIsEditingRaw(false);
              setContent(e.target.value);
            }}
            className="w-full h-96 p-3 rounded font-mono text-sm
              bg-white dark:bg-sidebar
              border border-border dark:border-sidebar-border
              text-foreground dark:text-sidebar-foreground
              placeholder:text-muted-foreground
              focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="# Approach&#10;&#10;Your writeup here..."
          />
        </div>

        <div>
          <h2 className="text-sm font-semibold mb-2 text-foreground">Code</h2>
          <div className="relative h-96 rounded overflow-hidden
            border border-border dark:border-sidebar-border
            bg-[#1e1e1e] dark:bg-[#1e1e1e]">
            {/* Syntax highlighted background */}
            <div className="absolute inset-0 overflow-auto pointer-events-none" id="code-highlight">
              <SyntaxHighlighter 
                language="python"
                style={theme === 'dark' ? vscDarkPlus : oneLight}
                customStyle={{ 
                  margin: 0, 
                  background: 'transparent',
                  padding: '0.75rem',
                }}
                className="text-sm"
              >
                {code || ' '}
              </SyntaxHighlighter>
            </div>
            
            {/* Transparent textarea overlay */}
            <textarea
              value={code}
              onChange={(e) => {
                setIsEditingRaw(false);
                setCode(e.target.value);
              }}
              onScroll={(e) => {
                // Sync scroll
                const highlight = document.getElementById('code-highlight');
                if (highlight) {
                  highlight.scrollTop = e.currentTarget.scrollTop;
                  highlight.scrollLeft = e.currentTarget.scrollLeft;
                }
              }}
              className="absolute inset-0 w-full h-full p-3 font-mono text-sm bg-transparent text-transparent caret-white resize-none outline-none"
              style={{ 
                caretColor: 'white',
                fontSize: '13px',
                lineHeight: '1.5',
                fontFamily: 'Menlo, Monaco, Consolas, "Andale Mono", "Ubuntu Mono", "Courier New", monospace',
                padding: '0.75rem',
                tabSize: 4,
              }}
              placeholder="function solution() {&#10;  // code&#10;}"
              spellCheck={false}
            />
          </div>
        </div>
      </div>

      {/* Bottom Row: Raw & Preview */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h2 className="text-sm font-semibold mb-2 text-foreground">Raw (as stored)</h2>
          {jsonError && <div className="text-red-600 dark:text-red-400 text-sm mb-2">{jsonError}</div>}
          <textarea
            value={rawInput}
            onChange={(e) => {
              setIsEditingRaw(true);
              setRawInput(e.target.value);
            }}
            className="w-full h-96 p-3 rounded font-mono text-sm
              bg-muted/50 dark:bg-sidebar/50
              border border-border dark:border-sidebar-border
              text-foreground dark:text-sidebar-foreground
              focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <h2 className="text-sm font-semibold mb-2 text-foreground">Preview</h2>
          <div className="rounded p-4 space-y-2 h-96 overflow-auto
            bg-white dark:bg-sidebar
            border border-border dark:border-sidebar-border
            text-foreground dark:text-sidebar-foreground">
            <div><strong>Title:</strong> {preview?.title || item.title}</div>
            <div><strong>Tags:</strong> {preview?.tags?.join(', ') || item.tags?.join(', ')}</div>
            <div><strong>Category:</strong> {preview?.category || item.category}</div>
            {(preview?.url || item.url) && <div><strong>URL:</strong> {preview?.url || item.url}</div>}
            
            <div className="border-t border-border dark:border-sidebar-border pt-2 mt-2">
              <strong>Content:</strong>
              <pre className="text-xs mt-1 whitespace-pre-wrap">{content || <span className="text-muted-foreground">No content</span>}</pre>
            </div>
            
            {code && <CodeDisplay code={code} />}
          </div>
        </div>
      </div>
    </div>
  );
}