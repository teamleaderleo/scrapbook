"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MarkdownEditor } from "@/components/space/markdown-editor";
import { CodeEditor } from "@/components/space/code-editor";
import { RawJsonEditor } from "@/components/space/raw-json-editor";
import { ItemPreview } from "@/components/space/item-preview";
import { SpaceHeader } from "@/components/space/space-header";
import { updateItemAction } from "@/app/space/actions";
import { Copy, Check } from "lucide-react";

interface EditItemClientProps {
  item: any; // server-fetched item shape
}

type Model = {
  id: string;
  title: string;
  url: string | null;
  tags: string[];
  category: string | null;
  content: string;
  code: string | null;
};

export function EditItemClient({ item }: EditItemClientProps) {
  const router = useRouter();

  // Canonical model (single source of truth for editors & preview)
  const [model, setModel] = useState<Model>(() => ({
    id: item.id,
    title: item.title ?? "",
    url: item.url ?? null,
    tags: item.tags ?? [],
    category: item.category ?? null,
    content: item.content ?? "",
    code: item.code ?? null,
  }));

  // Raw JSON text (can diverge while user is typing in JSON)
  const [rawInput, setRawInput] = useState(() => JSON.stringify(model, null, 2));
  const [jsonError, setJsonError] = useState<string>("");

  // Who changed last? avoids echo/feedback loops across editors
  const lastChangedBy = useRef<"json" | "markdown" | "code" | null>(null);

  // Is the raw JSON textarea currently focused?
  const [isEditingRaw, setIsEditingRaw] = useState(false);

  // Debounce timer for error display only (NOT for successful updates)
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // UX: em dash copy feedback
  const [copiedDash, setCopiedDash] = useState(false);

  // === JSON onChange handler: instant-when-valid, debounce-only-when-invalid ===
  const handleRawChange = (val: string) => {
    setRawInput(val);

    if (!isEditingRaw) {
      // When not focused, we let the mirror effect handle syncing; no need to parse here.
      return;
    }

    // Always try to parse immediately; if valid, update model right away.
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

      // Cancel any pending error display since it's valid now.
      if (errorTimer.current) {
        clearTimeout(errorTimer.current);
        errorTimer.current = null;
      }
      setJsonError("");

      // Mark JSON as the source and apply immediately (no debounce).
      lastChangedBy.current = "json";
      setModel((prev) => {
        const same =
          prev.title === next.title &&
          prev.url === next.url &&
          JSON.stringify(prev.tags) === JSON.stringify(next.tags) &&
          prev.category === next.category &&
          prev.content === next.content &&
          prev.code === next.code;
        return same ? prev : next;
      });
    } catch {
      // Invalid right now — don't touch the model, just debounce showing the error
      if (errorTimer.current) clearTimeout(errorTimer.current);
      errorTimer.current = setTimeout(() => {
        setJsonError("Invalid JSON");
      }, 300); // debounce only the error visibility
    }
  };

  // === Model -> Raw JSON (mirror when NOT editing JSON) ======================
  useEffect(() => {
    if (isEditingRaw) return; // don't fight the user's cursor while they're typing JSON
    if (lastChangedBy.current !== "json") {
      setRawInput(JSON.stringify(model, null, 2));
      setJsonError(""); // model always serializes to valid JSON
    }
  }, [model, isEditingRaw]);

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
      await updateItemAction(model.id, {
        title: model.title,
        url: model.url,
        tags: model.tags,
        category: model.category ?? "general",
        content: model.content,
        code: model.code,
      });
      router.refresh();
      router.push("/space");
    } catch (e) {
      // TODO: toast error
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
        // LEFT: show current (possibly JSON-edited) title in header
        leftContent={`Edit: ${model.title || item.title || "Untitled"}`}
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
              <h3 className="text-sm font-semibold text-foreground">Content (Markdown)</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2"
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

            <MarkdownEditor
              value={model.content}
              onChange={onMarkdownChange}
            />
          </div>

          {/* Right: Code editor */}
          <CodeEditor
            value={model.code ?? ""}
            onChange={onCodeChange}
          />
        </div>

        {/* Bottom Row: Raw & Preview */}
        <div className="grid grid-cols-2 gap-4">
          <RawJsonEditor
            value={rawInput}
            onChange={handleRawChange}
            onFocus={() => setIsEditingRaw(true)}
            onBlur={() => {
              setIsEditingRaw(false);
              // Clear any pending error timer on blur; we'll mirror model back shortly
              if (errorTimer.current) {
                clearTimeout(errorTimer.current);
                errorTimer.current = null;
              }
              // Mirror will run via the Model->Raw effect (since isEditingRaw=false)
            }}
            error={jsonError}
          />

          <ItemPreview
            item={{
              ...item,
              title: model.title,
              url: model.url,
              tags: model.tags,
              category: model.category ?? item.category,
            }}
            content={model.content}
            code={model.code ?? ""}
          />
        </div>
      </div>
    </div>
  );
}
