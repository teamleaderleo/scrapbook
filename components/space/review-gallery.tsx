"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { parseQuery } from "@/app/lib/searchlang";
import { searchItems } from "@/app/lib/item-search";
import { useItems } from "@/app/lib/contexts/item-context";
import { useNow } from "@/app/lib/hooks/useNow";
import ReactMarkdown from 'react-markdown';
import { Rating } from "ts-fsrs";
import { reviewOnce } from "@/app/lib/fsrs-adapter";
import { supabase } from "@/app/lib/db/supabase";
import type { ReviewState } from "@/app/lib/review-types";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export function ReviewGallery({ serverNow }: { serverNow: number }) {
  const nowMs = useNow(serverNow, 30000);
  const sp = useSearchParams();
  const router = useRouter();
  const tagsParam = sp.get("tags") ?? undefined;

  const { items: allItems, loading, reload } = useItems();
  const [mutations, setMutations] = useState<Record<string, ReviewState>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showContent, setShowContent] = useState(true);

  const q = useMemo(() => parseQuery(tagsParam), [tagsParam]);
  
  const items = useMemo(() => {
    const withMutations = allItems.map(it => {
      const mutation = mutations[it.id];
      return mutation ? { ...it, review: mutation } : it;
    });
    return searchItems(withMutations, q, nowMs);
  }, [allItems, mutations, q, nowMs]);

  const current = items[currentIndex];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'j') {
        setCurrentIndex(i => Math.min(i + 1, items.length - 1));
        setShowContent(true);
      }
      if (e.key === 'ArrowLeft' || e.key === 'k') {
        setCurrentIndex(i => Math.max(i - 1, 0));
        setShowContent(true);
      }
      if (e.key === ' ') {
        e.preventDefault();
        setShowContent(s => !s);
      }
      if (e.key === 'Escape') {
        router.push('/space' + (tagsParam ? `?tags=${tagsParam}` : ''));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [items.length, tagsParam, router]);

  const onReview = async (rating: Rating) => {
    if (!current) return;
    
    const next = reviewOnce(current.review, rating, Date.now());
    setMutations(prev => ({ ...prev, [current.id]: next }));
    
    await supabase.from('reviews').upsert({
      item_id: current.id,
      state: next.state,
      due: next.due,
      last_review: next.last_review,
      stability: next.stability,
      difficulty: next.difficulty,
      scheduled_days: next.scheduled_days,
      learning_steps: next.learning_steps,
      reps: next.reps,
      lapses: next.lapses,
      suspended: next.suspended || false,
    });

    // Auto-advance after review
    if (currentIndex < items.length - 1) {
      setCurrentIndex(i => i + 1);
      setShowContent(true);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (!current) return <div className="p-4">No items to review</div>;

  return (
    <div className="h-screen flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500">
            {currentIndex + 1} / {items.length}
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/space/edit/${current.id}`}>
              edit
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/space/add?duplicate=${current.id}`}>
              duplicate
            </Link>
          </Button>
        </div>
        <button
          onClick={() => router.push('/space' + (tagsParam ? `?tags=${tagsParam}` : ''))}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Back to list (Esc)
        </button>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold mb-4">{current.title}</h1>

      {/* Content */}
      {showContent && (
        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* Writeup */}
          <div className="flex-1 overflow-auto border rounded p-4 bg-white">
            <h2 className="text-lg font-semibold mb-2">Writeup</h2>
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{current.content || '*No writeup yet*'}</ReactMarkdown>
            </div>
          </div>

          {/* Code */}
          {current.code && (
            <div className="flex-1 overflow-auto border rounded bg-gray-900">
              <h2 className="text-lg font-semibold mb-2 p-4 pb-0 text-gray-100">Code</h2>
              <SyntaxHighlighter 
                language="python" // or detect from item
                style={vscDarkPlus}
                customStyle={{ margin: 0, background: 'transparent' }}
                className="text-sm"
              >
                {current.code}
              </SyntaxHighlighter>
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          ← → or j/k to navigate · Space to {showContent ? 'hide' : 'show'} content
        </div>
        
        {current.review && (
          <div className="flex gap-2">
            <button 
              onClick={() => onReview(Rating.Again)}
              className="px-3 py-1 rounded border hover:bg-gray-100"
            >
              Again (1)
            </button>
            <button 
              onClick={() => onReview(Rating.Hard)}
              className="px-3 py-1 rounded border hover:bg-gray-100"
            >
              Hard (2)
            </button>
            <button 
              onClick={() => onReview(Rating.Good)}
              className="px-3 py-1 rounded border hover:bg-gray-100"
            >
              Good (3)
            </button>
            <button 
              onClick={() => onReview(Rating.Easy)}
              className="px-3 py-1 rounded border hover:bg-gray-100"
            >
              Easy (4)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}