"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/app/lib/db/supabase";
import { useItems } from "@/app/lib/contexts/item-context";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export function AddItemFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { reload } = useItems();
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
    
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.from('items').insert({
      id: preview.id,
      user_id: user?.id || null,
      title: preview.title,
      slug: preview.id,
      url: preview.url || null,
      tags: preview.tags || [],
      category: preview.category || 'general',
      content: preview.content || '',
      code: preview.code || null,
      content_type: 'markdown',
      score: preview.score || null,
    });

    if (error) {
      setError(error.message);
    } else {
      await reload();
      router.push('/space');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Add Item</h1>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Input */}
        <div>
          <h2 className="text-sm font-semibold mb-2">JSON</h2>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-96 p-3 border rounded font-mono text-sm"
          />
        </div>

        {/* Auto Preview */}
        <div>
          <h2 className="text-sm font-semibold mb-2">Preview</h2>
          {error && <div className="text-red-600 mb-2">{error}</div>}
          {preview && (
            <div className="border rounded p-4 space-y-2">
              <div><strong>Title:</strong> {preview.title}</div>
              <div><strong>Tags:</strong> {preview.tags?.join(', ')}</div>
              <div><strong>Category:</strong> {preview.category}</div>
              {preview.url && <div><strong>URL:</strong> {preview.url}</div>}
              <div className="border-t pt-2 mt-2">
                <strong>Content:</strong>
                <pre className="text-xs mt-1 whitespace-pre-wrap">{preview.content}</pre>
              </div>
              {preview.code && (
                <div className="border-t pt-2 mt-2">
                  <strong>Code:</strong>
                  <div className="mt-1 bg-gray-900 rounded overflow-hidden">
                    <SyntaxHighlighter 
                      language="python"
                      style={vscDarkPlus}
                      customStyle={{ margin: 0, background: 'transparent', padding: '0.5rem' }}
                      className="text-xs"
                    >
                      {preview.code}
                    </SyntaxHighlighter>
                  </div>
                </div>
              )}
              <button
                onClick={handleSave}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Save Item
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AddItemForm() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <AddItemFormContent />
    </Suspense>
  );
}