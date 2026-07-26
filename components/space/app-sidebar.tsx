'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
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
import {
  ArrowLeft,
  ArrowRight,
  CircleHelp,
  Loader2,
  LogOut,
  Plus,
  Search,
} from 'lucide-react';
import { shortcuts } from '@/app/lib/sidebar-data';
import { useItems } from '@/app/lib/contexts/item-context';
import { createClient } from '@/utils/supabase/client';
import { ThemeToggle } from '@/components/theme-toggle';
import { GoogleIcon } from '@/components/icons/google-icon';
import { GitHubIcon } from '@/components/icons/github-icon';
import { SpaceLinkHint } from '@/components/space/space-link-hint';
import { useSpaceShortcuts } from '@/components/space/space-shortcut-provider';

export function AppSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();
  const { openHelp, openSearch } = useSpaceShortcuts();
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
    openSearch();
    closeMobile();
  };

  const triggerHelp = () => {
    openHelp();
    closeMobile();
  };

  return (
    <Sidebar className="flex h-dvh max-h-dvh max-w-[calc(100vw-0.75rem)] flex-col pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] md:h-svh md:max-h-svh md:pb-0 md:pt-0">
      <SidebarHeader className="m-0 h-12 shrink-0 border-b bg-background p-0 text-foreground">
        <div className="flex h-full items-center justify-between px-4">
          <Link href="/" onClick={closeMobile} className="text-lg font-bold leading-none">
            teamleaderleo
          </Link>
          <ThemeToggle />
        </div>
      </SidebarHeader>

      <div className="shrink-0 space-y-2 border-b p-3">
        <button
          onClick={triggerSearch}
          className="flex w-full items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
          type="button"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          <span className="flex-1 text-left">Search</span>
          <span className="hidden gap-1 sm:flex" aria-hidden="true">
            <kbd className="rounded border bg-background px-1.5 py-0.5 text-xs font-semibold">
              {isMac ? '⌘' : 'Ctrl'}
            </kbd>
            <kbd className="rounded border bg-background px-1.5 py-0.5 text-xs font-semibold">K</kbd>
          </span>
        </button>
        <button
          onClick={triggerHelp}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
          type="button"
          aria-label="Keyboard shortcuts"
        >
          <CircleHelp className="h-4 w-4" aria-hidden="true" />
          <span className="flex-1 text-left">Keyboard reference</span>
          <kbd
            className="rounded border bg-background px-1.5 py-0.5 text-xs font-semibold"
            aria-hidden="true"
          >
            ?
          </kbd>
        </button>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <SidebarContent className="py-3">
          {isAdmin ? (
            <SidebarGroup>
              <SidebarGroupLabel className="px-4">Actions</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton className="px-4 pl-6" asChild>
                      <Link href="/space/add" onClick={closeMobile} className="flex items-center gap-2">
                        <Plus className="h-4 w-4 shrink-0" />
                        <span className="min-w-0 flex-1 truncate">Add item</span>
                        <SpaceLinkHint />
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ) : null}

          <SidebarGroup>
            <SidebarGroupLabel className="px-4">View</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton className="px-4 pl-6" asChild>
                    <Link href={toggleViewHref} onClick={closeMobile} className="flex items-center gap-2">
                      {isReviewLike ? (
                        <ArrowLeft className="h-4 w-4 shrink-0" />
                      ) : (
                        <ArrowRight className="h-4 w-4 shrink-0" />
                      )}
                      <span className="min-w-0 flex-1 truncate">
                        {isReviewLike ? 'List' : 'Review'}
                      </span>
                      <SpaceLinkHint />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="px-4">Shortcuts</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {shortcuts.map((shortcut) => {
                  const href = isReviewLike
                    ? shortcut.href.replace('/space', '/space/review')
                    : shortcut.href;
                  return (
                    <SidebarMenuItem key={shortcut.label}>
                      <SidebarMenuButton asChild className="justify-start gap-2 px-4 pl-6">
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

      <SidebarFooter className="shrink-0 space-y-2 border-t p-3">
        {user ? (
          <>
            <div className="truncate px-2 text-sm text-muted-foreground" title={user.email}>
              {user.email}
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="w-full">
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
              className="w-full"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <GoogleIcon className="mr-2 h-4 w-4" />
              )}
              Google
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOAuthSignIn('github')}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <GitHubIcon className="mr-2 h-4 w-4" />
              )}
              GitHub
            </Button>
          </>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
