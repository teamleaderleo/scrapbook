"use client";
import { useState } from "react";
import { supabase } from "@/app/lib/db/supabase";
import { useRouter } from "next/navigation";

export default function AddItemPage() {
  const router = useRouter();
  const [input, setInput] = useState(`{
  "id": "unique-slug",
  "title": "Problem Title",
  "url": "https://leetcode.com/problems/...",
  "tags": ["type:leetcode", "company:google", "topic:array", "difficulty:easy"],
  "category": "leetcode",
  "content": "# Approach\\n\\nYour writeup here",
  "code": "function solution() {\\n  // code\\n}"
}`);
  const [preview, setPreview] = useState<any>(null);
  const [error, setError] = useState("");

  const handlePreview = () => {
    try {
      const parsed = JSON.parse(input);
      setPreview(parsed);
      setError("");
    } catch (e) {
      setError("Invalid JSON");
      setPreview(null);
    }
  };

  const handleSave = async () => {
    if (!preview) return;
    
    const { error } = await supabase.from('items').insert({
      id: preview.id,
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
      router.push('/space');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Add Item</h1>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Input */}
        <div>
          <h2 className="text-sm font-semibold mb-2">Paste JSON</h2>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-96 p-3 border rounded font-mono text-sm"
          />
          <button
            onClick={handlePreview}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Preview
          </button>
        </div>

        {/* Preview */}
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
                  <pre className="text-xs mt-1 bg-gray-900 text-gray-100 p-2 rounded">{preview.code}</pre>
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