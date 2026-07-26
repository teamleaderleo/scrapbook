'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const { setTheme } = useTheme();

  const toggle = () => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggle}
      className="relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/65 bg-background/42 text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.38),0_5px_14px_rgba(20,20,24,0.08)] backdrop-blur-xl transition-[background-color,color,transform,box-shadow] hover:-translate-y-px hover:bg-background/62 hover:text-foreground hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_8px_18px_rgba(20,20,24,0.11)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_6px_16px_rgba(0,0,0,0.24)]"
      aria-label="Toggle light and dark mode"
      type="button"
    >
      <Sun className="h-3.5 w-3.5 transition-all dark:scale-75 dark:opacity-0" />
      <Moon className="absolute h-3.5 w-3.5 scale-75 opacity-0 transition-all dark:scale-100 dark:opacity-100" />
    </button>
  );
}
