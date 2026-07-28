'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, ArrowRight, Loader2, LogOut, Plus, Search } from 'lucide-react';
import { shortcuts } from '@/app/lib/sidebar-data';
import { useItems } from '@/app/lib/contexts/item-context';
import { createClient } from '@/utils/supabase/client';
import { ThemeToggle } from '@/components/theme-toggle';
import { GoogleIcon } from '@/components/icons/google-icon';
import { GitHubIcon } from '@/components/icons/github-icon';
import { SpaceLinkHint } from '@/components/space/space-link-hint';
import { PaperCreature } from '@/components/paper-creature';

export function AppSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();
  const currentQuery = searchParams.get('tags') || '';
  const isReviewLike =
    pathname === '/space/review' ||
    pathname?.startsWith('/space/add') ||
    pathname?.startsWith('/space/edit');
  const { user, isAdmin, signOut } = useItems();
  const [loading, setLoading] = useState(false);
  const listHref = `/space${currentQuery ? `?tags=${currentQuery}` : ''}`;
  const reviewHref = `/space/review${currentQuery ? `?tags=${currentQuery}` : ''}`;
  const toggleViewHref = isReviewLike ? listHref : reviewHref;
  const isMac = useMemo(
    () =>
      typeof navigator !== 'undefined' &&
      (navigator.platform.includes('Mac') || /iPhone|iPad/i.test(navigator.platform)),
    [],
  );

  const closeMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const role = target?.getAttribute?.('role');
      const isTyping =
        tag === 'input' ||
        tag === 'textarea' ||
        target?.getAttribute('contenteditable') === 'true' ||
        role === 'textbox';
      if (isTyping) return;

      const isMod = event.metaKey || event.ctrlKey;
      if (isMod && event.altKey && (event.key === 'a' || event.code === 'KeyA')) {
        event.preventDefault();
        router.push('/space/add');
        return;
      }

      if (isMod && !event.altKey && !event.shiftKey && (event.key === 'e' || event.code === 'KeyE')) {
        event.preventDefault();
        router.push(isReviewLike ? listHref : reviewHref);
        return;
      }

      if (isMod && !event.altKey && event.shiftKey && (event.key === 'e' || event.code === 'KeyE')) {
        event.preventDefault();
        router.push(isReviewLike ? listHref : reviewHref);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isReviewLike, listHref, reviewHref, router]);

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      console.error('OAuth error:', error);
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.refresh();
    } catch {
      // The context reports sign-out failures.
    }
  };

  const triggerSearch = () => {
    window.dispatchEvent(new Event('open-search'));
    closeMobile();
  };

  return (
    <Sidebar className="flex h-dvh max-h-dvh max-w-[calc(100vw-0.75rem)] flex-col border-r border-border/70 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] md:h-svh md:max-h-svh md:pb-0 md:pt-0">
      <SidebarHeader className="m-0 h-14 shrink-0 border-b border-border/70 bg-background/85 p-0 text-foreground backdrop-blur-sm">
        <div className="flex h-full items-center justify-between px-4">
          <Link href="/" onClick={closeMobile} className="group min-w-0 leading-none">
            <span className="block truncate text-base font-semibold tracking-[-0.025em] group-hover:underline group-hover:decoration-border group-hover:underline-offset-4">
              teamleaderleo
            </span>
            <span className="mt-1 block font-mono text-[8px] uppercase tracking-[0.18em] text-muted-foreground">
              scrapbook room
            </span>
          </Link>
          <ThemeToggle />
        </div>
      </SidebarHeader>

      <div className="shrink-0 border-b border-dashed border-border/70 p-3">
        <button
          onClick={triggerSearch}
          className="material-paper flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-[transform,box-shadow] hover:-rotate-[0.25deg] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          type="button"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Search the clippings</span>
          <span className="hidden gap-1 sm:flex">
            <kbd className="rounded border border-black/15 bg-white/35 px-1.5 py-0.5 font-mono text-[10px] font-semibold">
              {isMac ? '⌘' : 'Ctrl'}
            </kbd>
            <kbd className="rounded border border-black/15 bg-white/35 px-1.5 py-0.5 font-mono text-[10px] font-semibold">
              K
            </kbd>
          </span>
        </button>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <SidebarContent className="py-3">
          {isAdmin ? (
            <SidebarGroup>
              <SidebarGroupLabel className="px-4 font-mono text-[9px] font-semibold uppercase tracking-[0.17em]">
                Workbench
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton className="mx-2 rounded-lg px-3" asChild>
                      <Link href="/space/add" onClick={closeMobile} className="flex items-center gap-2">
                        <Plus className="h-4 w-4 shrink-0" />
                        <span className="min-w-0 flex-1 truncate">Add a clipping</span>
                        <SpaceLinkHint />
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ) : null}

          <SidebarGroup>
            <SidebarGroupLabel className="px-4 font-mono text-[9px] font-semibold uppercase tracking-[0.17em]">
              Browse
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton className="mx-2 rounded-lg px-3" asChild>
                    <Link href={toggleViewHref} onClick={closeMobile} className="flex items-center gap-2">
                      {isReviewLike ? (
                        <ArrowLeft className="h-4 w-4 shrink-0" />
                      ) : (
                        <ArrowRight className="h-4 w-4 shrink-0" />
                      )}
                      <span className="min-w-0 flex-1 truncate">
                        {isReviewLike ? 'Back to clippings' : 'Review drawer'}
                      </span>
                      <SpaceLinkHint />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="px-4 font-mono text-[9px] font-semibold uppercase tracking-[0.17em]">
              Labels
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {shortcuts.map((shortcut) => {
                  const href = isReviewLike
                    ? shortcut.href.replace('/space', '/space/review')
                    : shortcut.href;
                  return (
                    <SidebarMenuItem key={shortcut.label}>
                      <SidebarMenuButton asChild className="mx-2 justify-start gap-2 rounded-lg px-3">
                        <Link href={href} onClick={closeMobile} className="flex items-center gap-2">
                          <span className="min-w-0 flex-1 truncate">{shortcut.label}</span>
                          <SpaceLinkHint />
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </ScrollArea>

      <SidebarFooter className="shrink-0 space-y-2 border-t border-dashed border-border/70 p-3">
        <div className="material-paper relative overflow-hidden rounded-xl border p-2.5">
          <span className="material-tape-strip" data-side="top" aria-hidden="true" />
          <div className="flex items-center gap-2.5">
            <PaperCreature
              pose={loading ? 'sniffing' : user ? 'reading' : 'idle'}
              size="sm"
              label="Scraplet sitting on a little paper shelf"
            />
            <div className="min-w-0">
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.15em]">Scraplet&apos;s shelf</p>
              <p className="mt-1 text-[11px] leading-4 opacity-70">
                {user ? 'Keeping your notes company.' : 'Saving a seat at the workbench.'}
              </p>
            </div>
          </div>
        </div>

        {user ? (
          <>
            <div className="truncate px-2 text-xs text-muted-foreground" title={user.email}>
              {user.email}
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="w-full rounded-lg">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="default"
              size="sm"
              onClick={() => handleOAuthSignIn('google')}
              disabled={loading}
              className="w-full rounded-lg"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2 h-4 w-4" />}
              Google
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOAuthSignIn('github')}
              disabled={loading}
              className="w-full rounded-lg"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GitHubIcon className="mr-2 h-4 w-4" />}
              GitHub
            </Button>
          </>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
