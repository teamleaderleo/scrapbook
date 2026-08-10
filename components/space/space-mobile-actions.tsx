'use client';

import { Code, Plus, Rows3, Search } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useItems } from '@/app/lib/contexts/item-context';
import { useSpaceShortcuts } from '@/components/space/space-shortcut-provider';

function ActionButton({
  label,
  disabled = false,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-1.5 text-[10px] font-semibold text-muted-foreground transition-[background-color,color,transform] hover:bg-muted/70 hover:text-foreground active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
      aria-label={label}
    >
      {children}
      <span className="max-w-full truncate">{label}</span>
    </button>
  );
}

export function SpaceMobileActions() {
  const pathname = usePathname();
  const { isAdmin, editorOpen } = useItems();
  const { executeShortcut } = useSpaceShortcuts();
  const inReader = pathname === '/space/review';
  const visible = pathname === '/space' || inReader;

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden"
      data-space-mobile-actions
    >
      <div
        role="toolbar"
        aria-label="Space mobile actions"
        className="mx-auto flex max-w-md items-stretch gap-1 rounded-2xl border border-border/75 bg-background/92 p-1.5 shadow-[0_-10px_32px_rgba(30,28,24,0.12)] backdrop-blur-xl dark:shadow-[0_-12px_34px_rgba(0,0,0,0.28)]"
      >
        <ActionButton
          label="Search items"
          onClick={() => void executeShortcut('search.toggle')}
        >
          <Search className="h-4 w-4" aria-hidden="true" />
        </ActionButton>
        <ActionButton
          label={inReader ? 'Open list' : 'Open reader'}
          onClick={() => void executeShortcut('navigation.toggle-view')}
        >
          <Rows3 className="h-4 w-4" aria-hidden="true" />
        </ActionButton>
        <ActionButton
          label={editorOpen ? 'Close code editor' : 'Open code editor'}
          onClick={() => void executeShortcut('editor.toggle')}
        >
          <Code className="h-4 w-4" aria-hidden="true" />
        </ActionButton>
        <ActionButton
          label="Add item"
          disabled={!isAdmin}
          onClick={() => void executeShortcut('navigation.add')}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </ActionButton>
      </div>
    </div>
  );
}
