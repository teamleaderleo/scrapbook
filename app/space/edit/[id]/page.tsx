"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/app/lib/db/supabase";
import { useParams, useRouter } from "next/navigation";
import { useItems } from "@/app/lib/contexts/item-context";
import { Button } from "@/components/ui/button";

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

  // Sync raw input changes to content and code
  useEffect(() => {
    if (!isEditingRaw) return;
    
    try {
      const parsed = JSON.parse(rawInput);
      setContent(parsed.content || '');
      setCode(parsed.code || '');
      setJsonError("");
    } catch (e) {
      setJsonError("Invalid JSON");
    }
  }, [rawInput, isEditingRaw]);

  // Sync content/code changes to raw input
  useEffect(() => {
    if (item && !isEditingRaw) {
      setRawInput(JSON.stringify({
        id: item.id,
        title: item.title,
        url: item.url,
        tags: item.tags,
        category: item.category,
        content: content,
        code: code,
      }, null, 2));
    }
  }, [content, code, item, isEditingRaw]);

  async function handleSave() {
    const { error } = await supabase
      .from('items')
      .update({ content, code, updated_at: new Date().toISOString() })
      .eq('id', params.id);
    
    if (!error) {
      await reload();
      router.push('/space');
    }
  }

  if (!item) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-4">
        <h1 className="text-2xl font-bold">Edit: {item.title}</h1>
        <Button onClick={handleSave}>
          Save Changes
        </Button>
      </div>
      
      {/* Top Row: Editors */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <h2 className="text-sm font-semibold mb-2">Content (Markdown)</h2>
          <textarea
            value={content}
            onChange={(e) => {
              setIsEditingRaw(false);
              setContent(e.target.value);
            }}
            className="w-full h-96 p-3 border rounded font-mono text-sm"
            placeholder="# Approach&#10;&#10;Your writeup here..."
          />
        </div>

        <div>
          <h2 className="text-sm font-semibold mb-2">Code</h2>
          <textarea
            value={code}
            onChange={(e) => {
              setIsEditingRaw(false);
              setCode(e.target.value);
            }}
            className="w-full h-96 p-3 border rounded font-mono text-sm bg-gray-900 text-gray-100"
            placeholder="function solution() {&#10;  // code&#10;}"
          />
        </div>
      </div>

      {/* Bottom Row: Raw & Preview */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h2 className="text-sm font-semibold mb-2">Raw (as stored)</h2>
          {jsonError && <div className="text-red-600 text-sm mb-2">{jsonError}</div>}
          <textarea
            value={rawInput}
            onChange={(e) => {
              setIsEditingRaw(true);
              setRawInput(e.target.value);
            }}
            className="w-full h-96 p-3 border rounded font-mono text-sm bg-gray-50"
          />
        </div>

        <div>
          <h2 className="text-sm font-semibold mb-2">Preview</h2>
          <div className="border rounded p-4 space-y-2 h-96 overflow-auto">
            <div><strong>Title:</strong> {item.title}</div>
            <div><strong>Tags:</strong> {item.tags?.join(', ')}</div>
            <div><strong>Category:</strong> {item.category}</div>
            {item.url && <div><strong>URL:</strong> {item.url}</div>}
            
            <div className="border-t pt-2 mt-2">
              <strong>Content:</strong>
              <pre className="text-xs mt-1 whitespace-pre-wrap">{content || <span className="text-gray-400">No content</span>}</pre>
            </div>
            
            {code && (
              <div className="border-t pt-2 mt-2">
                <strong>Code:</strong>
                <pre className="text-xs mt-1 bg-gray-900 text-gray-100 p-2 rounded">{code}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}