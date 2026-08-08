'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

type ThemeTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { finished: Promise<unknown> };
};

export function ThemeToggle() {
  const { setTheme } = useTheme();

  const toggle = () => {
    const isDark = document.documentElement.classList.contains('dark');
    const applyTheme = () => setTheme(isDark ? 'light' : 'dark');
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    const transitionDocument = document as ThemeTransitionDocument;

    if (!transitionDocument.startViewTransition || reduceMotion) {
      applyTheme();
      return;
    }

    document.documentElement.dataset.themeTransition = 'active';
    try {
      const transition = transitionDocument.startViewTransition(applyTheme);
      void transition.finished.finally(() => {
        delete document.documentElement.dataset.themeTransition;
      });
    } catch {
      delete document.documentElement.dataset.themeTransition;
      applyTheme();
    }
  };

  return (
    <button
      data-theme-toggle
      onClick={toggle}
      className="group relative inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/70 bg-card text-foreground shadow-[0_3px_10px_rgba(20,20,24,0.09)] transition-[background-color,color,transform,box-shadow] duration-300 hover:-translate-y-px hover:bg-muted hover:shadow-[0_6px_15px_rgba(20,20,24,0.13)] active:translate-y-0 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)] motion-reduce:transition-none"
      aria-label="Toggle light and dark mode"
      type="button"
    >
      <span
        data-theme-corona
        aria-hidden="true"
        className="absolute h-5 w-5 rounded-full border border-amber-400/45 opacity-75 transition-[opacity,transform] duration-500 motion-safe:animate-[spin_18s_linear_infinite] dark:scale-50 dark:opacity-0 motion-reduce:animate-none"
      >
        <span className="absolute -left-1 top-1/2 h-px w-1 bg-amber-500/55" />
        <span className="absolute -right-1 top-1/2 h-px w-1 bg-amber-500/55" />
        <span className="absolute left-1/2 -top-1 h-1 w-px bg-amber-500/55" />
        <span className="absolute bottom-[-0.25rem] left-1/2 h-1 w-px bg-amber-500/55" />
      </span>

      <Sun
        data-theme-sun
        aria-hidden="true"
        className="h-3.5 w-3.5 text-amber-600 transition-[opacity,transform] duration-500 ease-out dark:-rotate-90 dark:scale-50 dark:opacity-0"
      />

      <Moon
        data-theme-moon
        aria-hidden="true"
        className="absolute h-3.5 w-3.5 translate-y-4 rotate-45 scale-75 text-slate-200 opacity-0 transition-[opacity,transform] duration-500 ease-out dark:translate-y-0 dark:rotate-0 dark:scale-100 dark:opacity-100"
      />
      <span
        data-theme-star
        aria-hidden="true"
        className="absolute left-[6px] top-[6px] h-0.5 w-0.5 rounded-full bg-slate-100 opacity-0 dark:opacity-80 dark:motion-safe:animate-pulse motion-reduce:animate-none"
      />
      <span
        data-theme-star
        aria-hidden="true"
        className="absolute right-[6px] top-[8px] h-0.5 w-0.5 rounded-full bg-slate-100 opacity-0 dark:opacity-65 dark:motion-safe:animate-pulse motion-reduce:animate-none"
        style={{ animationDelay: '700ms' }}
      />
      <span
        data-theme-star
        aria-hidden="true"
        className="absolute bottom-[6px] right-[8px] h-px w-px rounded-full bg-slate-100 opacity-0 dark:opacity-70 dark:motion-safe:animate-pulse motion-reduce:animate-none"
        style={{ animationDelay: '1.3s' }}
      />
    </button>
  );
}
