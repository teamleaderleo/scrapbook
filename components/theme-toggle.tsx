"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="relative inline-flex h-7 w-12 items-center rounded-full bg-neutral-100 dark:bg-neutral-800">
        <span className="inline-flex h-7 w-7 transform items-center justify-center rounded-full bg-white dark:bg-gray-900 border border-neutral-300 dark:border-neutral-800 shadow-sm" />
      </div>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700"
      aria-label="Toggle theme"
    >
      <span className="sr-only">Toggle theme</span>
      <span
        className={`${
          resolvedTheme === "dark" ? "translate-x-5" : "translate-x-0"
        } inline-flex h-7 w-7 transform items-center justify-center rounded-full bg-white dark:bg-gray-900 border border-neutral-300 dark:border-neutral-800 shadow-sm transition-transform`}
      >
        {resolvedTheme === "dark" ? (
          <Moon className="h-4 w-4 text-white" />
        ) : (
          <Sun className="h-4 w-4 text-amber-500" />
        )}
      </span>
    </button>
  );
}