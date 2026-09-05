'use client';

import { createContext, useContext, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react';
import { useTheme } from 'next-themes';
import { Palette } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { practiceThemePreview, practiceThemeStyles, type PracticeAppearanceData, type PracticeTheme } from '@/lib/practice-appearance';
import styles from './practice.module.css';

const storageKey = 'scrapbook:practice-themes:v1';
const changedEvent = 'scrapbook:practice-theme-changed';
let sessionChoice: string | null = null;
let sessionOnly = false;
function snapshot() {
  if (sessionOnly) return sessionChoice;
  try { return window.localStorage.getItem(storageKey) ?? sessionChoice; }
  catch { return sessionChoice; }
}
function subscribe(notify: () => void) {
  window.addEventListener('storage', notify);
  window.addEventListener(changedEvent, notify);
  return () => {
    window.removeEventListener('storage', notify);
    window.removeEventListener(changedEvent, notify);
  };
}
function preferences(raw: string | null): Record<string, string> {
  try {
    const value = JSON.parse(raw ?? '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch { return {}; }
}

const Appearance = createContext<(PracticeAppearanceData & {
  index: number;
  choose: (theme: PracticeTheme) => void;
}) | null>(null);

export function usePracticeAppearance() { return useContext(Appearance); }

export function PracticeAppearance({ data, children }: { data: PracticeAppearanceData; children: ReactNode }) {
  const { resolvedTheme, setTheme } = useTheme();
  const raw = useSyncExternalStore(subscribe, snapshot, () => null);
  const mode = resolvedTheme === 'dark' ? 'dark' : 'light';
  const saved = preferences(raw);
  const preferred = data.themes.findIndex(theme => theme.type === mode && theme.id === saved[mode]);
  const index = preferred >= 0 ? preferred : data.themes.findIndex(theme => theme.type === mode);
  const theme = data.themes[index];
  function choose(next: PracticeTheme) {
    const value = JSON.stringify({ ...preferences(snapshot()), [next.type]: next.id });
    sessionChoice = value;
    try { window.localStorage.setItem(storageKey, value); sessionOnly = false; }
    catch { sessionOnly = true; }
    setTheme(next.type);
    window.dispatchEvent(new Event(changedEvent));
  }
  return (
    <Appearance.Provider value={{ ...data, index, choose }}>
      <div data-practice-theme={theme.id} style={practiceThemeStyles(theme) as CSSProperties} className="min-h-screen bg-background text-foreground">
        {children}
      </div>
    </Appearance.Provider>
  );
}

export function PracticeThemePicker() {
  const appearance = usePracticeAppearance();
  const [open, setOpen] = useState(false);
  if (!appearance) return null;
  const active = appearance.themes[appearance.index];
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className={`${styles.control} inline-flex items-center gap-2 text-sm`} aria-label={`Practice theme: ${active.name}`}>
          <Palette size={16} aria-hidden="true" />{active.name}
        </button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined} className="max-h-[85dvh] w-[calc(100vw-2rem)] max-w-xl overflow-y-auto p-5" style={{ borderRadius: 0 }}>
        <DialogTitle>Practice theme</DialogTitle>
        {(['dark', 'light'] as const).map(mode => (
          <section key={mode} className="min-w-0" aria-label={`${mode === 'dark' ? 'Dark' : 'Light'} themes`}>
            <h3 className="mb-2 text-xs text-muted-foreground">{mode === 'dark' ? 'Dark' : 'Light'}</h3>
            <div className="divide-y divide-white/10">
              {appearance.themes.map((theme, index) => theme.type === mode ? (
                <button
                  key={theme.id}
                  aria-pressed={active.id === theme.id}
                  onClick={() => { appearance.choose(theme); setOpen(false); }}
                  className="block w-full border-l-2 px-4 py-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{ background: theme.background, color: theme.foreground, borderLeftColor: active.id === theme.id ? theme.accent : 'transparent' }}
                >
                  <span className="text-sm">{theme.name}</span>
                  <code aria-hidden="true" className="mt-1 block whitespace-pre-wrap break-words font-mono text-xs">
                    {appearance.syntax[practiceThemePreview].map(token => <span key={token.start} style={{ color: token.colors[index] }}>{practiceThemePreview.slice(token.start, token.end)}</span>)}
                  </code>
                </button>
              ) : null)}
            </div>
          </section>
        ))}
      </DialogContent>
    </Dialog>
  );
}

export function PracticeSyntaxCode({ text }: { text: string }) {
  const appearance = usePracticeAppearance();
  const tokens = appearance?.syntax[text];
  if (!appearance || !tokens) return <>{text}</>;
  return <>{tokens.map(token => <span key={token.start} style={{ color: token.colors[appearance.index] }}>{text.slice(token.start, token.end)}</span>)}</>;
}
