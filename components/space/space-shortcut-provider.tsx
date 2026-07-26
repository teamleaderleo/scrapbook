'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useItems } from '@/app/lib/contexts/item-context';
import { startNavigationFeedback } from '@/components/navigation-feedback';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  formatSpaceShortcutBinding,
  getSpaceShortcutReference,
  installSpaceShortcutListener,
  type SpaceShortcutId,
  type SpaceShortcutRegistration,
  type SpaceShortcutRegistrations,
} from '@/lib/space-shortcuts';

const CATEGORIES = ['General', 'Navigation', 'Review', 'Editor', 'List'] as const;

type SpaceShortcutContextValue = {
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  openSearch: () => void;
  openHelp: () => void;
  registerShortcut: (
    id: SpaceShortcutId,
    registration: SpaceShortcutRegistration,
  ) => () => void;
  executeShortcut: (id: SpaceShortcutId) => boolean;
};

const SpaceShortcutContext = createContext<SpaceShortcutContextValue | null>(null);

type OwnedRegistration = SpaceShortcutRegistration & { token: symbol };

export function SpaceShortcutProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAdmin, editorOpen, setEditorOpen } = useItems();
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [registrationVersion, bumpRegistrationVersion] = useReducer((value) => value + 1, 0);
  const dynamicRegistrations = useRef(new Map<SpaceShortcutId, OwnedRegistration>());
  const getRuntimeRegistrations = useRef<() => SpaceShortcutRegistrations>(() => new Map());

  const currentQuery = searchParams.get('tags') ?? '';
  const isReviewLike =
    pathname === '/space/review' ||
    pathname.startsWith('/space/add') ||
    pathname.startsWith('/space/edit');
  const listHref = `/space${currentQuery ? `?tags=${encodeURIComponent(currentQuery)}` : ''}`;
  const reviewHref = `/space/review${currentQuery ? `?tags=${encodeURIComponent(currentQuery)}` : ''}`;

  const navigate = useCallback(
    (href: string, label: string) => {
      startNavigationFeedback(href, label);
      router.push(href);
    },
    [router],
  );

  const builtInRegistrations = useMemo<SpaceShortcutRegistrations>(() => {
    const registrations = new Map<SpaceShortcutId, SpaceShortcutRegistration>();

    registrations.set('help.open', {
      run: () => setHelpOpen((open) => !open),
    });
    registrations.set('help.close', {
      active: helpOpen,
      run: () => setHelpOpen(false),
    });
    registrations.set('search.toggle', {
      run: () => setSearchOpen((open) => !open),
    });
    registrations.set('editor.toggle', {
      run: () => setEditorOpen(!editorOpen),
    });
    registrations.set('navigation.add', {
      enabled: isAdmin,
      disabledReason: isAdmin ? undefined : 'Admin access is required',
      run: () => navigate('/space/add', 'new item'),
    });
    registrations.set('navigation.toggle-view', {
      run: () =>
        navigate(isReviewLike ? listHref : reviewHref, isReviewLike ? 'item list' : 'review'),
    });

    return registrations;
  }, [editorOpen, helpOpen, isAdmin, isReviewLike, listHref, navigate, reviewHref, setEditorOpen]);

  const getBaseRegistrations = useCallback(() => {
    const registrations = new Map<SpaceShortcutId, SpaceShortcutRegistration>();
    for (const [id, registration] of builtInRegistrations) registrations.set(id, registration);
    for (const [id, registration] of dynamicRegistrations.current) {
      registrations.set(id, registration);
    }
    return registrations;
  }, [builtInRegistrations]);

  const getRegistrationsForDispatch = useCallback(() => {
    const registrations = getBaseRegistrations();
    if (!helpOpen) return registrations;

    for (const [id, registration] of registrations) {
      if (id === 'help.open' || id === 'help.close') continue;
      registrations.set(id, { ...registration, active: false });
    }
    return registrations;
  }, [getBaseRegistrations, helpOpen]);

  getRuntimeRegistrations.current = getRegistrationsForDispatch;

  useEffect(
    () => installSpaceShortcutListener(document, () => getRuntimeRegistrations.current()),
    [],
  );

  const registerShortcut = useCallback(
    (id: SpaceShortcutId, registration: SpaceShortcutRegistration) => {
      const token = Symbol(id);
      dynamicRegistrations.current.set(id, { ...registration, token });
      bumpRegistrationVersion();

      return () => {
        const current = dynamicRegistrations.current.get(id);
        if (current?.token !== token) return;
        dynamicRegistrations.current.delete(id);
        bumpRegistrationVersion();
      };
    },
    [],
  );

  const executeShortcut = useCallback(
    (id: SpaceShortcutId) => {
      const registration = getBaseRegistrations().get(id);
      if (!registration || registration.active === false || registration.enabled === false) {
        return false;
      }
      registration.run();
      return true;
    },
    [getBaseRegistrations],
  );

  const openSearch = useCallback(() => setSearchOpen(true), []);
  const openHelp = useCallback(() => setHelpOpen(true), []);

  const contextValue = useMemo<SpaceShortcutContextValue>(
    () => ({
      searchOpen,
      setSearchOpen,
      openSearch,
      openHelp,
      registerShortcut,
      executeShortcut,
    }),
    [executeShortcut, openHelp, openSearch, registerShortcut, searchOpen],
  );

  const referenceEntries = useMemo(
    () => getSpaceShortcutReference(getBaseRegistrations()),
    [getBaseRegistrations, registrationVersion],
  );
  const isMac = useMemo(
    () =>
      typeof navigator !== 'undefined' &&
      (navigator.platform.includes('Mac') || /iPhone|iPad/i.test(navigator.platform)),
    [],
  );

  return (
    <SpaceShortcutContext.Provider value={contextValue}>
      {children}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent
          data-space-shortcut-help
          className="max-h-[min(42rem,calc(100dvh-2rem))] max-w-2xl overflow-y-auto p-0"
        >
          <DialogHeader className="border-b px-5 pb-4 pt-5 text-left sm:px-6">
            <DialogTitle>Space keyboard shortcuts</DialogTitle>
            <DialogDescription>
              This reference is generated from the same registry that handles each command. Plain
              keys pause while you type, compose text, or use browser-owned controls.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 px-5 pb-6 sm:px-6">
            {CATEGORIES.map((category) => {
              const entries = referenceEntries.filter(
                (entry) => entry.definition.category === category,
              );
              if (entries.length === 0) return null;

              return (
                <section key={category} aria-labelledby={`space-shortcut-${category.toLowerCase()}`}>
                  <h2
                    id={`space-shortcut-${category.toLowerCase()}`}
                    className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"
                  >
                    {category}
                  </h2>
                  <div className="divide-y rounded-lg border" role="list">
                    {entries.map(({ definition, available, unavailableReason }) => (
                      <div
                        key={definition.id}
                        data-space-shortcut-id={definition.id}
                        aria-disabled={!available}
                        className="flex items-start justify-between gap-4 px-3 py-3 aria-disabled:opacity-55"
                        role="listitem"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{definition.description}</p>
                          {!available ? (
                            <p className="mt-1 text-xs text-muted-foreground">{unavailableReason}</p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                          {definition.keys.map((binding, index) => {
                            const label = formatSpaceShortcutBinding(binding, isMac);
                            return (
                              <span key={`${definition.id}-${index}`}>
                                <span className="sr-only">{label.spoken}</span>
                                <kbd
                                  aria-hidden="true"
                                  className="inline-flex min-h-7 items-center rounded border bg-muted/45 px-2 font-mono text-[11px] font-semibold"
                                >
                                  {label.visual}
                                </kbd>
                                {index < definition.keys.length - 1 ? (
                                  <span
                                    aria-hidden="true"
                                    className="mx-1 text-xs text-muted-foreground"
                                  >
                                    or
                                  </span>
                                ) : null}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </SpaceShortcutContext.Provider>
  );
}

export function useSpaceShortcuts() {
  const context = useContext(SpaceShortcutContext);
  if (!context) throw new Error('useSpaceShortcuts must be used inside SpaceShortcutProvider');
  return context;
}

export function useSpaceShortcut(
  id: SpaceShortcutId,
  registration: SpaceShortcutRegistration,
) {
  const { registerShortcut } = useSpaceShortcuts();
  useEffect(() => registerShortcut(id, registration), [id, registerShortcut, registration]);
}
