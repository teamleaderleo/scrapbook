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
      className="group relative inline-flex h-8 w-14 items-center rounded-full border border-black/10 bg-gradient-to-r from-[#e8dfcc] via-[#c9c5c7] to-[#24252b] p-0.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.18),0_1px_0_rgba(255,255,255,0.45)] transition hover:contrast-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:border-white/15"
      aria-label="Toggle light and dark mode"
      type="button"
    >
      <Sun className="absolute left-1.5 h-3.5 w-3.5 text-[#725e32] transition-opacity dark:opacity-45" />
      <Moon className="absolute right-1.5 h-3.5 w-3.5 text-[#ded9e7] opacity-55 transition-opacity dark:opacity-100" />
      <span className="relative z-10 inline-flex h-6 w-6 translate-x-0 items-center justify-center rounded-full border border-black/10 bg-[#f4efe4] shadow-[0_2px_7px_rgba(0,0,0,0.28)] transition-transform duration-200 dark:translate-x-6 dark:border-white/10 dark:bg-[#18191e]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#a58e5b] dark:bg-[#aaa2b5]" />
      </span>
    </button>
  );
}
