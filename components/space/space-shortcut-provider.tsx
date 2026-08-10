'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
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
import { useSidebar } from '@/components/ui/sidebar';
import { useIsMacPlatform } from '@/hooks/use-is-mac-platform';
import {
  formatSpaceShortcutBinding,
  getSpaceShortcutReference,
  installSpaceShortcutListener,
  type SpaceShortcutCategory,
  type SpaceShortcutId,
  type SpaceShortcutRegistration,
  type SpaceShortcutRegistrations,
} from '@/lib/space-shortcuts';

const CATEGORIES: readonly SpaceShortcutCategory[] = [
  'General',
  'Navigation',
  'Review',
  'Editor',
  'List',
  'Trail',
];

type SpaceShortcutContextValue = {
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  openSearch: () => void;
  openHelp: () => void;
  registerShortcut: (
    id: SpaceShortcutId,
    registration: SpaceShortcutRegistration
  ) => () => void;
  executeShortcut: (id: SpaceShortcutId) => boolean;
};

const SpaceShortcutContext = createContext<SpaceShortcutContextValue | null>(
  null
);

type OwnedRegistration = SpaceShortcutRegistration & { token: symbol };

export function SpaceShortcutProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAdmin, editorOpen, setEditorOpen } = useItems();
  const { toggleSidebar } = useSidebar();
  const isMac = useIsMacPlatform();
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [dynamicRegistrations, setDynamicRegistrations] = useState(
    () => new Map<SpaceShortcutId, OwnedRegistration>()
  );
  const runtimeRegistrations = useRef<SpaceShortcutRegistrations>(new Map());

  const currentQuery = searchParams.get('tags') ?? '';
  const laneParam = searchParams.get('lane') ?? '';
  const isReviewLike =
    pathname === '/space/review' ||
    pathname.startsWith('/space/add') ||
    pathname.startsWith('/space/edit');

  const currentParams = useMemo(() => {
    const params = new URLSearchParams();
    if (currentQuery) params.set('tags', currentQuery);
    if (laneParam) params.set('lane', laneParam);
    return params.toString();
  }, [currentQuery, laneParam]);
  const listHref = `/space${currentParams ? `?${currentParams}` : ''}`;
  const reviewHref = `/space/review${currentParams ? `?${currentParams}` : ''}`;

  const navigate = useCallback(
    (href: string, label: string) => {
      startNavigationFeedback(href, label);
      router.push(href);
    },
    [router]
  );

  const builtInRegistrations = useMemo<SpaceShortcutRegistrations>(() => {
    const registrations = new Map<
      SpaceShortcutId,
      SpaceShortcutRegistration
    >();

    registrations.set('help.open', {
      run: () => {
        setSearchOpen(false);
        setHelpOpen(open => !open);
      },
    });
    registrations.set('help.close', {
      active: helpOpen,
      run: () => setHelpOpen(false),
    });
    registrations.set('search.toggle', {
      run: () => {
        setHelpOpen(false);
        setSearchOpen(open => !open);
      },
    });
    registrations.set('sidebar.toggle', {
      run: event => {
        toggleSidebar();
        // SidebarProvider retains a window-level fallback for non-Space consumers.
        // Stop the handled Space event before that fallback can toggle twice.
        event?.stopPropagation();
      },
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
        navigate(
          isReviewLike ? listHref : reviewHref,
          isReviewLike ? 'item list' : 'reader'
        ),
    });

    return registrations;
  }, [
    editorOpen,
    helpOpen,
    isAdmin,
    isReviewLike,
    listHref,
    navigate,
    reviewHref,
    setEditorOpen,
    toggleSidebar,
  ]);

  const baseRegistrations = useMemo(() => {
    const registrations = new Map<
      SpaceShortcutId,
      SpaceShortcutRegistration
    >();
    for (const [id, registration] of builtInRegistrations) {
      registrations.set(id, registration);
    }
    for (const [id, registration] of dynamicRegistrations) {
      registrations.set(id, registration);
    }
    return registrations;
  }, [builtInRegistrations, dynamicRegistrations]);

  const dispatchRegistrations = useMemo(() => {
    if (!helpOpen && !searchOpen) return baseRegistrations;

    const registrations = new Map(baseRegistrations);
    for (const [id, registration] of registrations) {
      const keepActive = helpOpen
        ? id === 'help.open' || id === 'help.close'
        : id === 'search.toggle';
      if (keepActive) continue;
      registrations.set(id, { ...registration, active: false });
    }
    return registrations;
  }, [baseRegistrations, helpOpen, searchOpen]);

  useLayoutEffect(() => {
    runtimeRegistrations.current = dispatchRegistrations;
  }, [dispatchRegistrations]);

  useEffect(
    () =>
      installSpaceShortcutListener(
        document,
        () => runtimeRegistrations.current
      ),
    []
  );

  const registerShortcut = useCallback(
    (id: SpaceShortcutId, registration: SpaceShortcutRegistration) => {
      const token = Symbol(id);
      setDynamicRegistrations(current => {
        const next = new Map(current);
        next.set(id, { ...registration, token });
        return next;
      });

      return () => {
        setDynamicRegistrations(current => {
          const owned = current.get(id);
          if (owned?.token !== token) return current;
          const next = new Map(current);
          next.delete(id);
          return next;
        });
      };
    },
    []
  );

  const executeShortcut = useCallback((id: SpaceShortcutId) => {
    const registration = runtimeRegistrations.current.get(id);
    if (
      !registration ||
      registration.active === false ||
      registration.enabled === false
    ) {
      return false;
    }
    registration.run();
    return true;
  }, []);

  const openSearch = useCallback(() => {
    setHelpOpen(false);
    setSearchOpen(true);
  }, []);
  const openHelp = useCallback(() => {
    setSearchOpen(false);
    setHelpOpen(true);
  }, []);

  const contextValue = useMemo<SpaceShortcutContextValue>(
    () => ({
      searchOpen,
      setSearchOpen,
      openSearch,
      openHelp,
      registerShortcut,
      executeShortcut,
    }),
    [executeShortcut, openHelp, openSearch, registerShortcut, searchOpen]
  );

  const referenceEntries = useMemo(
    () => getSpaceShortcutReference(baseRegistrations),
    [baseRegistrations]
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
              Generated from the same command registry Space uses at runtime.
              Plain keys pause while you type, compose text, or use browser-owned
              controls.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 px-5 pb-6 sm:px-6">
            {CATEGORIES.map(category => {
              const entries = referenceEntries.filter(
                entry => entry.definition.category === category
              );
              if (entries.length === 0) return null;

              return (
                <section
                  key={category}
                  aria-labelledby={`space-shortcut-${category.toLowerCase()}`}
                >
                  <h2
                    id={`space-shortcut-${category.toLowerCase()}`}
                    className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"
                  >
                    {category}
                  </h2>
                  <ul className="divide-y rounded-lg border">
                    {entries.map(
                      ({ definition, available, unavailableReason }) => (
                        <li
                          key={definition.id}
                          data-space-shortcut-id={definition.id}
                          data-available={available ? 'true' : 'false'}
                          className="flex items-start justify-between gap-4 px-3 py-3 data-[available=false]:opacity-55"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium">
                              {definition.description}
                            </p>
                            {!available ? (
                              <p className="mt-1 text-xs text-muted-foreground">
                                Unavailable: {unavailableReason}
                              </p>
                            ) : null}
                          </div>
                          <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                            {definition.keys.map((binding, index) => {
                              const label = formatSpaceShortcutBinding(
                                binding,
                                isMac
                              );
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
                        </li>
                      )
                    )}
                  </ul>
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
  if (!context) {
    throw new Error(
      'useSpaceShortcuts must be used inside SpaceShortcutProvider'
    );
  }
  return context;
}

export function useSpaceShortcut(
  id: SpaceShortcutId,
  registration: SpaceShortcutRegistration
) {
  const { registerShortcut } = useSpaceShortcuts();
  useLayoutEffect(
    () => registerShortcut(id, registration),
    [id, registerShortcut, registration]
  );
}
