"use client";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function MarkdownEditor({ value, onChange, placeholder = "# Approach\n\nYour writeup here..." }: MarkdownEditorProps) {
  return (
    <div>
      <h2 className="text-sm font-semibold mb-2 text-foreground">Content (Markdown)</h2>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-96 p-3 rounded font-mono text-sm
          bg-white dark:bg-sidebar
          border border-border dark:border-sidebar-border
          text-foreground dark:text-sidebar-foreground
          placeholder:text-muted-foreground
          focus:outline-none focus:ring-2 focus:ring-ring"
        placeholder={placeholder}
      />
    </div>
  );
}