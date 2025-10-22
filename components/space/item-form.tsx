"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MarkdownEditor } from "@/components/space/markdown-editor";
import { CodeEditor } from "@/components/space/code-editor";
import { RawJsonEditor } from "@/components/space/raw-json-editor";
import { MetadataJsonEditor } from "@/components/space/metadata-json-editor";
import { ItemPreview } from "@/components/space/item-preview";
import { SpaceHeader } from "@/components/space/space-header";
import { addItemAction, updateItemAction } from "@/app/space/actions";
import { Copy, Check } from "lucide-react";

// Canonical shape for the item
type Model = {
  id: string;
  title: string;
  url: string | null;
  tags: string[];
  category: string | null;
  content: string;
  code: string | null;
};

interface ItemFormProps {
  item?: any; // if provided, we're in edit mode; otherwise add mode
  mode: "add" | "edit";
}

const DEFAULT_MODEL: Model = {
  id: "unique-slug",
  title: "0. Problem Title",
  url: "https://leetcode.com/problems/...",
  tags: ["type:leetcode", "company:google", "topic:array", "difficulty:easy"],
  category: "leetcode",
  content: "# Approach\n\nYour writeup here",
  code: "def solution():\n  # code\n",
};

export function ItemForm({ item, mode }: ItemFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const duplicateId = searchParams.get("duplicate") || null;
  const supabase = createClient();

  // === Canonical model (single source of truth) ==============================
  const [model, setModel] = useState<Model>(() => {
    if (mode === "edit" && item) {
      return {
        id: item.id,
        title: item.title ?? "",
        url: item.url ?? null,
        tags: item.tags ?? [],
        category: item.category ?? null,
        content: item.content ?? "",
        code: item.code ?? null,
      };
    }
    return DEFAULT_MODEL;
  });

  // === Raw JSON text (can diverge while typing in the JSON box) ==============
  const [rawInput, setRawInput] = useState(() => JSON.stringify(model, null, 2));
  const [jsonError, setJsonError] = useState<string>("");

  // === Metadata JSON text (can diverge while typing in the metadata box) =====
  const [metadataInput, setMetadataInput] = useState(() => {
    const { content, code, ...metadata } = model;
    return JSON.stringify(metadata, null, 2);
  });
  const [metadataError, setMetadataError] = useState<string>("");

  // Who changed last? avoids echo/feedback loops across editors
  const lastChangedBy = useRef<"json" | "markdown" | "code" | "meta" | null>(null);

  // Is the raw JSON textarea currently focused?
  const [isEditingRaw, setIsEditingRaw] = useState(false);

  // Is the metadata JSON textarea currently focused?
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);

  // Only debounce the error visibility (NOT successful updates)
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const metadataErrorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // UX: em dash copy feedback
  const [copiedDash, setCopiedDash] = useState(false);

  // === Duplicate-from-item support (only in add mode) ========================
  useEffect(() => {
    if (mode !== "add" || !duplicateId) return;
    (async () => {
      const { data } = await supabase.from("items").select("*").eq("id", duplicateId).single();
      if (data) {
        const template: Model = {
          id: `${data.id}-copy`,
          title: `${data.title} (Copy)`,
          url: data.url ?? null,
          tags: data.tags ?? [],
          category: data.category ?? null,
          content: data.content ?? "",
          code: data.code ?? null,
        };
        lastChangedBy.current = "meta";
        setModel(template);
        setRawInput(JSON.stringify(template, null, 2));
        const { content, code, ...metadata } = template;
        setMetadataInput(JSON.stringify(metadata, null, 2));
        setJsonError("");
        setMetadataError("");
      }
    })();
  }, [mode, duplicateId, supabase]);

  // === JSON onChange: instant-when-valid, debounce-only-when-invalid =========
  const handleRawChange = (val: string) => {
    setRawInput(val);

    if (!isEditingRaw) {
      return;
    }

    try {
      const parsed = JSON.parse(val);

      const next: Model = {
        id: parsed.id ?? model.id,
        title: parsed.title ?? model.title,
        url: parsed.url ?? model.url ?? null,
        tags: parsed.tags ?? model.tags ?? [],
        category: parsed.category ?? model.category ?? null,
        content: parsed.content ?? model.content ?? "",
        code: parsed.code ?? model.code ?? null,
      };

      if (errorTimer.current) {
        clearTimeout(errorTimer.current);
        errorTimer.current = null;
      }
      setJsonError("");

      lastChangedBy.current = "json";
      setModel((prev) => {
        const same =
          prev.id === next.id &&
          prev.title === next.title &&
          prev.url === next.url &&
          JSON.stringify(prev.tags) === JSON.stringify(next.tags) &&
          prev.category === next.category &&
          prev.content === next.content &&
          prev.code === next.code;
        return same ? prev : next;
      });
    } catch {
      if (errorTimer.current) clearTimeout(errorTimer.current);
      errorTimer.current = setTimeout(() => {
        setJsonError("Invalid JSON");
      }, 300);
    }
  };

  // === Metadata onChange: instant-when-valid, debounce-only-when-invalid =====
  const handleMetadataChange = (val: string) => {
    setMetadataInput(val);

    if (!isEditingMetadata) {
      return;
    }

    try {
      const parsed = JSON.parse(val);

      if (metadataErrorTimer.current) {
        clearTimeout(metadataErrorTimer.current);
        metadataErrorTimer.current = null;
      }
      setMetadataError("");

      lastChangedBy.current = "meta";
      setModel((prev) => ({
        ...prev,
        id: parsed.id ?? prev.id,
        title: parsed.title ?? prev.title,
        url: parsed.url ?? prev.url ?? null,
        tags: parsed.tags ?? prev.tags ?? [],
        category: parsed.category ?? prev.category ?? null,
      }));
    } catch {
      if (metadataErrorTimer.current) clearTimeout(metadataErrorTimer.current);
      metadataErrorTimer.current = setTimeout(() => {
        setMetadataError("Invalid JSON");
      }, 300);
    }
  };

  // === Model -> Raw JSON mirror (only when NOT editing JSON) =================
  useEffect(() => {
    if (isEditingRaw) return;
    if (lastChangedBy.current !== "json") {
      setRawInput(JSON.stringify(model, null, 2));
      setJsonError("");
    }
  }, [model, isEditingRaw]);

  // === Model -> Metadata JSON mirror (only when NOT editing metadata) ========
  useEffect(() => {
    if (isEditingMetadata) return;
    if (lastChangedBy.current !== "meta") {
      const { content, code, ...metadata } = model;
      setMetadataInput(JSON.stringify(metadata, null, 2));
      setMetadataError("");
    }
  }, [model, isEditingMetadata]);

  // === Title input change =====================================================
  const onTitleChange = (val: string) => {
    lastChangedBy.current = "meta";
    setModel((m) => ({ ...m, title: val }));
  };

  // === Markdown editor change ================================================
  const onMarkdownChange = (val: string) => {
    lastChangedBy.current = "markdown";
    setModel((m) => ({ ...m, content: val }));
  };

  // === Code editor change =====================================================
  const onCodeChange = (val: string) => {
    lastChangedBy.current = "code";
    setModel((m) => ({ ...m, code: val }));
  };

  // === Save ==================================================================
  async function handleSave() {
    try {
      if (mode === "add") {
        await addItemAction({
          id: model.id,
          title: model.title,
          url: model.url,
          tags: model.tags,
          category: model.category ?? "general",
          content: model.content,
          code: model.code,
        });
      } else {
        await updateItemAction(model.id, {
          title: model.title,
          url: model.url,
          tags: model.tags,
          category: model.category ?? "general",
          content: model.content,
          code: model.code,
        });
      }

      // NOTE: actions already call revalidatePath("/space").
      // Avoid refresh+push race and navigate inside a transition.
      startTransition(() => {
        router.replace("/space");
      });
    } catch (e: any) {
      setJsonError(e?.message || "Failed to save");
      console.error(e);
    }
  }

  // === Em dash copy ==========================================================
  const copyEmDash = async () => {
    await navigator.clipboard.writeText("—");
    setCopiedDash(true);
    setTimeout(() => setCopiedDash(false), 1500);
  };

  return (
    <div className="min-h-screen bg-background">
      <SpaceHeader
        leftContent={`${mode === "add" ? "Add" : "Edit"}: ${model.title || "Untitled"}`}
        centerContent={
          <Button onClick={handleSave} disabled={isPending} size="sm" className="bg-accent text-accent-foreground">
            {mode === "add" ? "Save Item" : "Save Changes"}
          </Button>
        }
      />

      <div className="p-6 w-full">
        {/* Top Row: Editors */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Left: Title + Content (Markdown) */}
          <div className="flex flex-col space-y-4">
            {/* Title Input + Em dash button */}
            <div className="flex items-center gap-2">
              <Input
                value={model.title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="Enter title..."
                className="font-medium flex-1 bg-white dark:bg-sidebar border-border dark:border-sidebar-border"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-10 px-2"
                onClick={copyEmDash}
                title="Copy em dash (—)"
              >
                {copiedDash ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" /> —
                  </>
                )}
              </Button>
            </div>

            {/* Markdown Editor */}
            <div className="flex-1 flex flex-col">
              <MarkdownEditor value={model.content} onChange={onMarkdownChange} />
            </div>
          </div>

          {/* Right: Code editor */}
          <CodeEditor value={model.code ?? ""} onChange={onCodeChange} />
        </div>

        {/* Middle Row: Metadata & Preview */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <MetadataJsonEditor
            value={metadataInput}
            onChange={handleMetadataChange}
            onFocus={() => setIsEditingMetadata(true)}
            onBlur={() => {
              setIsEditingMetadata(false);
              if (metadataErrorTimer.current) {
                clearTimeout(metadataErrorTimer.current);
                metadataErrorTimer.current = null;
              }
            }}
            error={metadataError}
          />

          <ItemPreview
            item={{
              id: model.id,
              title: model.title,
              url: model.url,
              tags: model.tags,
              category: model.category ?? "general",
            }}
            content={model.content}
            code={model.code ?? ""}
          />
        </div>

        {/* Bottom Row: Raw (full width) */}
        <div>
          <RawJsonEditor
            value={rawInput}
            onChange={handleRawChange}
            onFocus={() => setIsEditingRaw(true)}
            onBlur={() => {
              setIsEditingRaw(false);
              if (errorTimer.current) {
                clearTimeout(errorTimer.current);
                errorTimer.current = null;
              }
            }}
            error={jsonError}
          />
        </div>
      </div>
    </div>
  );
}
