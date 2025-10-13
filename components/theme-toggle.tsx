"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { setTheme } = useTheme();

  const toggle = () => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      onClick={toggle}
      className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700"
      aria-label="Toggle theme"
    >
      <span className="sr-only">Toggle theme</span>

      {/* Thumb */}
      <span
        className="inline-flex h-7 w-7 transform items-center justify-center rounded-full
                   bg-white dark:bg-gray-900 border border-neutral-300 dark:border-neutral-800
                   shadow-sm transition-transform translate-x-0 dark:translate-x-5"
      >
        {/* Icons: visible immediately, no JS needed */}
        <Sun className="h-4 w-4 text-amber-500 dark:hidden" />
        <Moon className="h-4 w-4 hidden dark:block text-white" />
      </span>
    </button>
  );
}
