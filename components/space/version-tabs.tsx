"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface VersionTabsProps {
  versions: Array<{ label: string }>;
  activeIdx: number;
  defaultIdx: number;
  onAdd: () => void;
  onDelete: (idx: number) => void;
  onRename: (idx: number, label: string) => void;
  onSetActive: (idx: number) => void;
  onSetDefault: (idx: number) => void;
}

export function VersionTabs({
  versions,
  activeIdx,
  defaultIdx,
  onAdd,
  onDelete,
  onRename,
  onSetActive,
  onSetDefault,
}: VersionTabsProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {versions.map((v, i) => (
        <div key={i} className="flex items-center gap-1">
          <div className="flex items-center">
            <Input
              value={v.label}
              onChange={(e) => onRename(i, e.target.value)}
              className={`h-8 px-2 w-20 text-sm ${
                i === activeIdx
                  ? 'bg-accent text-accent-foreground border-accent'
                  : 'border-border'
              }`}
              onClick={() => onSetActive(i)}
            />
            {i === defaultIdx && <span className="ml-1 text-xs">★</span>}
          </div>
          {versions.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => onDelete(i)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
          {i !== defaultIdx && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => onSetDefault(i)}
            >
              Set default
            </Button>
          )}
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={onAdd}>
        <Plus className="h-3 w-3 mr-1" /> Add version
      </Button>
    </div>
  );
}