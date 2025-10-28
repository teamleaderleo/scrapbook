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
import { Copy, Check, Plus, Trash2 } from "lucide-react";
import { VersionTabs } from "@/components/space/version-tabs";

// Singleton/Canonical shape for the item with only editable fields
type Model = {
  slug: string;
  title: string;
  url: string | null;
  tags: string[];
  category: string | null;
  defaultIndex: number;
  versions: Array<{
    label: string;
    content: string;
    code: string | null;
  }>;
};

interface ItemFormProps {
  item?: any;
  mode: "add" | "edit";
}

const DEFAULT_MODEL: Model = {
  slug: "unique-slug",
  title: "0. Problem Title",
  url: "https://leetcode.com/problems/...",
  tags: ["type:leetcode", "company:google", "topic:array", "difficulty:easy"],
  category: "leetcode",
  defaultIndex: 0,
  versions: [
    {
      label: "v1",
      content: "# Approach\n\nYour writeup here",
      code: "def solution():\n  # code\n",
    },
  ],
};

export function ItemForm({ item, mode }: ItemFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const duplicateId = searchParams.get("duplicate") || null;
  const supabase = createClient();

  // Store the database ID separately (only needed for updates)
  const itemId = useRef<string | null>(mode === "edit" && item ? item.id : null);

  // Which version we're currently editing
  const [activeVersionIdx, setActiveVersionIdx] = useState(0);

  const [model, setModel] = useState<Model>(() => {
    if (mode === "edit" && item) {
      return {
        slug: item.slug ?? "untitled-slug",
        title: item.title ?? "",
        url: item.url ?? null,
        tags: item.tags ?? [],
        category: item.category ?? null,
        defaultIndex: item.defaultIndex ?? 0,
        versions: item.versions ?? [{ label: "v1", content: "", code: null }],
      };
    }
    return DEFAULT_MODEL;
  });

  // === Raw JSON text (Holds all the stuff) =========================
  const [rawInput, setRawInput] = useState(() => JSON.stringify(model, null, 2));
  const [jsonError, setJsonError] = useState<string>("");

  // === Metadata JSON text (excludes content and code) ========================
  const [metadataInput, setMetadataInput] = useState(() => {
    const { versions, ...metadata } = model;
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

  useEffect(() => {
    // Reset to default when switching to add mode (and not duplicating)
    if (mode === "add" && !duplicateId) {
      lastChangedBy.current = "meta";
      setModel(DEFAULT_MODEL);
      setRawInput(JSON.stringify(DEFAULT_MODEL, null, 2));
      const { versions, ...metadata } = DEFAULT_MODEL;
      setMetadataInput(JSON.stringify(metadata, null, 2));
      setJsonError("");
      setMetadataError("");
      setActiveVersionIdx(0);
    }
  }, [mode, duplicateId]);

  // === Duplicate-from-item support (only in add mode) ========================
  useEffect(() => {
    if (mode !== "add" || !duplicateId) return;
    (async () => {
      const { data } = await supabase.from("items").select("*").eq("id", duplicateId).single();
      if (data) {
        const template: Model = {
          slug: `${data.slug ?? data.id}-copy`,
          title: `${data.title} (Copy)`,
          url: data.url ?? null,
          tags: data.tags ?? [],
          category: data.category ?? null,
          defaultIndex: data.default_index ?? 0,
          versions: data.versions ?? [{ label: "v1", content: "", code: null }],
        };
        lastChangedBy.current = "meta";
        setModel(template);
        setRawInput(JSON.stringify(template, null, 2));
        const { versions, ...metadata } = template;
        setMetadataInput(JSON.stringify(metadata, null, 2));
        setJsonError("");
        setMetadataError("");
        setActiveVersionIdx(0);
      }
    })();
  }, [mode, duplicateId, supabase]);

  // === JSON onChange: instant-when-valid, debounce-only-when-invalid =========
  const handleRawChange = (val: string) => {
    setRawInput(val);
    if (!isEditingRaw) return;

    try {
      const parsed = JSON.parse(val);
      const next: Model = {
        slug: parsed.slug ?? model.slug,
        title: parsed.title ?? model.title,
        url: parsed.url ?? model.url ?? null,
        tags: parsed.tags ?? model.tags ?? [],
        category: parsed.category ?? model.category ?? null,
        defaultIndex: parsed.defaultIndex ?? model.defaultIndex ?? 0,
        versions: parsed.versions ?? model.versions ?? [],
      };

      if (errorTimer.current) {
        clearTimeout(errorTimer.current);
        errorTimer.current = null;
      }
      setJsonError("");

      lastChangedBy.current = "json";
      setModel(next);
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
    if (!isEditingMetadata) return;

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
        slug: parsed.slug ?? prev.slug,
        title: parsed.title ?? prev.title,
        url: parsed.url ?? prev.url ?? null,
        tags: parsed.tags ?? prev.tags ?? [],
        category: parsed.category ?? prev.category ?? null,
        defaultIndex: parsed.defaultIndex ?? prev.defaultIndex ?? 0,
      }));
    } catch {
      if (metadataErrorTimer.current) clearTimeout(metadataErrorTimer.current);
      metadataErrorTimer.current = setTimeout(() => {
        setMetadataError("Invalid JSON");
      }, 300);
    }
  };

  const handleMetadataPasted = (text: string) => {
    setMetadataInput(text);            // reflect UI
    setIsEditingMetadata(true);        // temporarily mark as editing to allow parse/apply

    try {
      const parsed = JSON.parse(text);
      if (metadataErrorTimer.current) {
        clearTimeout(metadataErrorTimer.current);
        metadataErrorTimer.current = null;
      }
      setMetadataError("");
      lastChangedBy.current = "meta";  // prevent mirror effects from clobbering
      setModel((prev) => ({
        ...prev,
        slug: parsed.slug ?? prev.slug,
        title: parsed.title ?? prev.title,
        url: parsed.url ?? prev.url ?? null,
        tags: parsed.tags ?? prev.tags ?? [],
        category: parsed.category ?? prev.category ?? null,
        defaultIndex: parsed.defaultIndex ?? prev.defaultIndex ?? 0,
      }));
    } catch {
      if (metadataErrorTimer.current) clearTimeout(metadataErrorTimer.current);
      metadataErrorTimer.current = setTimeout(() => {
        setMetadataError("Invalid JSON");
      }, 300);
    } finally {
      setIsEditingMetadata(false);
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
      const { versions, ...metadata } = model;
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
    setModel((m) => ({
      ...m,
      versions: m.versions.map((v, i) =>
        i === activeVersionIdx ? { ...v, content: val } : v
      ),
    }));
  };

  // === Code editor change =====================================================
  const onCodeChange = (val: string) => {
    lastChangedBy.current = "code";
    setModel((m) => ({
      ...m,
      versions: m.versions.map((v, i) =>
        i === activeVersionIdx ? { ...v, code: val } : v
      ),
    }));
  };

  // === Save ==================================================================

  const addVersion = () => {
    // Find highest version number in existing labels
    const versionNumbers = model.versions
      .map(v => {
        const match = v.label.match(/^v(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(n => n > 0);
    
    const nextNum = versionNumbers.length > 0 
      ? Math.max(...versionNumbers) + 1 
      : 1;

    setModel((m) => ({
      ...m,
      versions: [
        ...m.versions,
        {
          label: `v${nextNum}`,
          content: "",
          code: null,
        },
      ],
    }));
    setActiveVersionIdx(model.versions.length);
  };

  const deleteVersion = (idx: number) => {
    if (model.versions.length === 1) return; // Don't delete last version
    setModel((m) => ({
      ...m,
      versions: m.versions.filter((_, i) => i !== idx),
      defaultIndex: m.defaultIndex >= idx && m.defaultIndex > 0 ? m.defaultIndex - 1 : m.defaultIndex,
    }));
    if (activeVersionIdx >= idx && activeVersionIdx > 0) {
      setActiveVersionIdx(activeVersionIdx - 1);
    }
  };

  const renameVersion = (idx: number, newLabel: string) => {
    setModel((m) => ({
      ...m,
      versions: m.versions.map((v, i) =>
        i === idx ? { ...v, label: newLabel } : v
      ),
    }));
  };

  const setAsDefault = (idx: number) => {
    setModel((m) => ({ ...m, defaultIndex: idx }));
  };

  async function handleSave() {
    try {
      if (mode === "add") {
        await addItemAction({
          slug: model.slug,
          title: model.title,
          url: model.url,
          tags: model.tags,
          category: model.category ?? "general",
          defaultIndex: model.defaultIndex,
          versions: model.versions,
        });
      } else {
        if (!itemId.current) throw new Error("No item ID for update");
        await updateItemAction(itemId.current, {
          slug: model.slug,
          title: model.title,
          url: model.url,
          tags: model.tags,
          category: model.category ?? "general",
          defaultIndex: model.defaultIndex,
          versions: model.versions,
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

  const activeVersion = model.versions[activeVersionIdx];

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
        {/* Version tabs */}
        <VersionTabs
          versions={model.versions}
          activeIdx={activeVersionIdx}
          defaultIdx={model.defaultIndex}
          onAdd={addVersion}
          onDelete={deleteVersion}
          onRename={(idx, label) => {
            setModel((m) => ({
              ...m,
              versions: m.versions.map((v, i) =>
                i === idx ? { ...v, label } : v
              ),
            }));
          }}
          onSetActive={setActiveVersionIdx}
          onSetDefault={setAsDefault}
        />

        {/* Top Row: Editors */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Left: Title + Content */}
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
              <MarkdownEditor value={activeVersion.content} onChange={onMarkdownChange} />
            </div>
          </div>

          {/* Right: Code editor */}
          <CodeEditor value={activeVersion.code ?? ""} onChange={onCodeChange} />
        </div>

        {/* Middle Row: Metadata & Preview */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <MetadataJsonEditor
            value={metadataInput}
            onChange={handleMetadataChange}
            onPasted={handleMetadataPasted}
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
              id: itemId.current || "preview",
              title: model.title,
              url: model.url,
              tags: model.tags,
              category: model.category ?? "general",
            }}
            content={activeVersion.content}
            code={activeVersion.code ?? ""}
          />
        </div>

        {/* Bottom Row: Raw */}
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