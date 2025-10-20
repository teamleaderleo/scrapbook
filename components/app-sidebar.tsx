"use client";

import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LogOut, Loader2, Search } from "lucide-react";
import { shortcuts } from "@/app/lib/sidebar-data";
import { useItems } from "@/app/lib/contexts/item-context";
import { createClient } from "@/utils/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { GoogleIcon } from "@/components/icons/google-icon";
import { GitHubIcon } from "@/components/icons/github-icon";

export function AppSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentQuery = searchParams.get("tags") || "";
  const isReviewMode = pathname === "/space/review";

  const { user, isAdmin, signOut } = useItems();
  const [loading, setLoading] = useState(false);

  const listHref = `/space${currentQuery ? `?tags=${currentQuery}` : ""}`;
  const reviewHref = `/space/review${currentQuery ? `?tags=${currentQuery}` : ""}`;
  const toggleViewHref = isReviewMode ? listHref : reviewHref;

  // Hotkeys:
  // ⌘/Ctrl + Alt + A => /space/add
  // ⌘/Ctrl + E => prefers /space (if already there, toggles to /space/review)
  // ⌘/Ctrl + Shift + E => prefers /space/review (if already there, toggles to /space)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const role = target?.getAttribute?.("role");
      const isTyping =
        tag === "input" ||
        tag === "textarea" ||
        target?.getAttribute("contenteditable") === "true" ||
        role === "textbox";

      if (isTyping) return;

      const isMod = e.metaKey || e.ctrlKey;

      // Add Item
      if (isMod && e.altKey && (e.key === "a" || e.code === "KeyA")) {
        e.preventDefault();
        router.push("/space/add");
        return;
      }

      // Base Space (E)
      if (isMod && !e.altKey && !e.shiftKey && (e.key === "e" || e.code === "KeyE")) {
        e.preventDefault();
        if (isReviewMode) {
          router.push(listHref);
        } else {
          router.push(reviewHref); // toggle if already on base
        }
        return;
      }

      // Review Mode (Shift+E)
      if (isMod && !e.altKey && e.shiftKey && (e.key === "e" || e.code === "KeyE")) {
        e.preventDefault();
        if (isReviewMode) {
          router.push(listHref); // toggle if already on review
        } else {
          router.push(reviewHref);
        }
        return;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, isReviewMode, listHref, reviewHref]);

  // TODO: add signInWithOAuth into the context later to centralize all auth flows
  const handleOAuthSignIn = async (provider: "google" | "github") => {
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("OAuth error:", error);
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.refresh();
    } catch (e) {
      // Already logged inside signOut, but we can toast here if desired
    }
  };

  // Trigger search dialog (will be handled by Ctrl+K event)
  const triggerSearch = () => {
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      ctrlKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);
  };

  // Safe-ish platform check (client component)
  const isMac = useMemo(
    () =>
      typeof navigator !== "undefined" &&
      (navigator.platform.includes("Mac") || /iPhone|iPad/i.test(navigator.platform)),
    []
  );

  return (
    <Sidebar className="flex flex-col h-screen">
      <SidebarHeader className="h-[48px] p-0 m-0 bg-background text-foreground border-b">
        <div className="flex h-full items-center justify-between px-4">
          <Link href="/" className="text-lg font-bold leading-none">
            teamleaderleo
          </Link>
          <ThemeToggle />
        </div>
      </SidebarHeader>

      {/* Search Bar */}
      <div className="p-4 border-b">
        <button
          onClick={triggerSearch}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-muted/50 hover:bg-muted rounded-md transition-colors"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Search...</span>
          <div className="flex gap-1">
            <kbd className="px-1.5 py-0.5 text-xs font-semibold border rounded bg-background">
              {isMac ? "⌘" : "Ctrl"}
            </kbd>
            <kbd className="px-1.5 py-0.5 text-xs font-semibold border rounded bg-background">
              K
            </kbd>
          </div>
        </button>
      </div>

      {/* Only show Actions if admin */}
      {isAdmin && (
        <SidebarGroup>
          <SidebarGroupLabel className="px-4">Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                {/* Make the button itself the flex row to control wrapping */}
                <SidebarMenuButton
                  className="flex w-full items-center justify-between gap-2 px-4 pl-6"
                  asChild
                >
                  <Link href="/space/add">
                    <span className="truncate whitespace-nowrap leading-none">
                      + Add Item
                    </span>
                    <span className="flex gap-1 text-muted-foreground shrink-0 whitespace-nowrap">
                      <kbd className="px-1.5 py-0.5 text-[10px] font-semibold border rounded bg-background">
                        {isMac ? "⌘" : "Ctrl"}
                      </kbd>
                      <kbd className="px-1.5 py-0.5 text-[10px] font-semibold border rounded bg-background">
                        Alt
                      </kbd>
                      <kbd className="px-1.5 py-0.5 text-[10px] font-semibold border rounded bg-background">
                        A
                      </kbd>
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      <ScrollArea className="flex-1">
        <SidebarContent className="py-4">
          {/* View mode toggle */}
          <SidebarGroup>
            <SidebarGroupLabel className="px-4">View Mode</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  {/* Make the button itself the flex row + no-wrap */}
                  <SidebarMenuButton
                    className="flex w-full items-center justify-between gap-2 px-4 pl-6"
                    asChild
                  >
                    <Link href={toggleViewHref}>
                      <span className="truncate whitespace-nowrap leading-none">
                        {isReviewMode ? "← Back to List" : "→ Review"}
                      </span>

                      {/* Show ONLY the opposite view's hotkey and keep it on one line */}
                      {isReviewMode ? (
                        <span className="flex gap-1 text-muted-foreground shrink-0 whitespace-nowrap">
                          <kbd className="px-1.5 py-0.5 text-[10px] font-semibold border rounded bg-background">
                            {isMac ? "⌘" : "Ctrl"}
                          </kbd>
                          <kbd className="px-1.5 py-0.5 text-[10px] font-semibold border rounded bg-background">
                            E
                          </kbd>
                        </span>
                      ) : (
                        <span className="flex gap-1 text-muted-foreground shrink-0 whitespace-nowrap">
                          <kbd className="px-1.5 py-0.5 text-[10px] font-semibold border rounded bg-background">
                            {isMac ? "⌘" : "Ctrl"}
                          </kbd>
                          <kbd className="px-1.5 py-0.5 text-[10px] font-semibold border rounded bg-background">
                            Shift
                          </kbd>
                          <kbd className="px-1.5 py-0.5 text-[10px] font-semibold border rounded bg-background">
                            E
                          </kbd>
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Shortcuts */}
          <SidebarGroup>
            <SidebarGroupLabel className="px-4">Shortcuts</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {shortcuts.map((s) => {
                  const href = isReviewMode
                    ? s.href.replace("/space", "/space/review")
                    : s.href;

                  return (
                    <SidebarMenuItem key={s.label}>
                      <SidebarMenuButton asChild className="justify-start gap-2 px-4 pl-6">
                        <Link href={href}>{s.label}</Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </ScrollArea>

      {/* Auth Section */}
      <SidebarFooter className="border-t p-4 space-y-2">
        {user ? (
          // User is logged in
          <>
            <div className="text-sm text-muted-foreground truncate px-2" title={user.email}>
              {user.email}
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="w-full">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </>
        ) : (
          // User is not logged in
          <>
            <Button
              variant="default"
              size="sm"
              onClick={() => handleOAuthSignIn("google")}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <GoogleIcon className="w-4 h-4 mr-2" />
              )}
              Sign in with Google
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOAuthSignIn("github")}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <GitHubIcon className="w-4 h-4 mr-2" />
              )}
              Sign in with GitHub
            </Button>
          </>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
