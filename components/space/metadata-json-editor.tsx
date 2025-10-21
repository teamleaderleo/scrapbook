"use client";

interface MetadataJsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function MetadataJsonEditor({ value, onChange, error, onFocus, onBlur }: MetadataJsonEditorProps) {
  return (
    <div>
      <h2 className="text-sm font-semibold mb-2 text-foreground">Metadata</h2>
      {error && <div className="text-red-600 dark:text-red-400 text-sm mb-2">{error}</div>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        className="w-full h-96 p-3 rounded font-mono text-sm
          bg-muted/50 dark:bg-sidebar/50
          border border-border dark:border-sidebar-border
          text-foreground dark:text-sidebar-foreground
          focus:outline-none focus:ring-2 focus:ring-ring"
        spellCheck={false}
      />
    </div>
  );
}