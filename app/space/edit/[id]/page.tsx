"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/app/lib/db/supabase";
import { useParams, useRouter } from "next/navigation";
import { useItems } from "@/app/lib/contexts/item-context";

export default function EditItemPage() {
  const params = useParams();
  const router = useRouter();
  const { reload } = useItems();
  const [item, setItem] = useState<any>(null);
  const [content, setContent] = useState("");
  const [code, setCode] = useState("");

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
    }
  }

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
      <h1 className="text-2xl font-bold mb-4">Edit: {item.title}</h1>
      
      {/* Top Row: Editors */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <h2 className="text-sm font-semibold mb-2">Content (Markdown)</h2>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-96 p-3 border rounded font-mono text-sm"
            placeholder="# Approach&#10;&#10;Your writeup here..."
          />
        </div>

        <div>
          <h2 className="text-sm font-semibold mb-2">Code</h2>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-96 p-3 border rounded font-mono text-sm bg-gray-900 text-gray-100"
            placeholder="function solution() {&#10;  // code&#10;}"
          />
        </div>
      </div>

      {/* Bottom Row: Raw & Preview */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h2 className="text-sm font-semibold mb-2">Raw (as stored)</h2>
          <div className="border rounded p-4 bg-gray-50 h-96 overflow-auto">
            <pre className="text-xs font-mono whitespace-pre-wrap">{JSON.stringify({
              id: item.id,
              title: item.title,
              url: item.url,
              tags: item.tags,
              category: item.category,
              content: content,
              code: code,
            }, null, 2)}</pre>
          </div>
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
            
            <button
              onClick={handleSave}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}