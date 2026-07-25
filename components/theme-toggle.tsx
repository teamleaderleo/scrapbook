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
      className="relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/12 bg-[#e2dfd8] text-black/58 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_1px_3px_rgba(0,0,0,0.08)] transition hover:bg-[#d8d4cc] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:border-white/12 dark:bg-[#202126] dark:text-white/60 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_1px_4px_rgba(0,0,0,0.25)] dark:hover:bg-[#292a30] dark:hover:text-white"
      aria-label="Toggle light and dark mode"
      type="button"
    >
      <Sun className="h-3.5 w-3.5 transition-all dark:scale-75 dark:opacity-0" />
      <Moon className="absolute h-3.5 w-3.5 scale-75 opacity-0 transition-all dark:scale-100 dark:opacity-100" />
    </button>
  );
}
