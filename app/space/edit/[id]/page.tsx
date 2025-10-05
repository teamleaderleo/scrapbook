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
      await reload(); // Refresh cache
      router.push('/space');
    }
  }

  if (!item) return <div>Loading...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Edit: {item.title}</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2">Content (Markdown)</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-64 p-3 border rounded font-mono text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Code</label>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-64 p-3 border rounded font-mono text-sm bg-gray-900 text-gray-100"
          />
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}