"use client";

interface RawJsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function RawJsonEditor({ value, onChange, error }: RawJsonEditorProps) {
  return (
    <div>
      <h2 className="text-sm font-semibold mb-2 text-foreground">Raw (as stored)</h2>
      {error && <div className="text-red-600 dark:text-red-400 text-sm mb-2">{error}</div>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-96 p-3 rounded font-mono text-sm
          bg-muted/50 dark:bg-sidebar/50
          border border-border dark:border-sidebar-border
          text-foreground dark:text-sidebar-foreground
          focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}