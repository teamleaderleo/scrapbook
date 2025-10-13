"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
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
import { LogOut, Loader2 } from "lucide-react";
import { shortcuts } from "@/app/lib/sidebar-data";
import { useItems } from "@/app/lib/contexts/item-context";
import { createClient } from "@/utils/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("tags") || "";
  const isReviewMode = pathname === "/space/review";
  
  const { user, isAdmin } = useItems();
  const supabase = createClient();
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Sign out error:", e);
    }
  };
  const [loading, setLoading] = useState(false);

  const toggleViewHref = isReviewMode 
    ? `/space${currentQuery ? `?tags=${currentQuery}` : ''}`
    : `/space/review${currentQuery ? `?tags=${currentQuery}` : ''}`;

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setLoading(true)
    const supabase = createClient()
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      console.error('OAuth error:', error)
      setLoading(false)
    }
  }

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
      
      {/* Only show Actions if admin */}
      {isAdmin && (
        <SidebarGroup>
          <SidebarGroupLabel className="px-4">Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="justify-start gap-2 px-4 pl-6">
                  <Link href="/space/add">+ Add Item</Link>
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
                  <SidebarMenuButton asChild className="justify-start gap-2 px-4 pl-6">
                    <Link href={toggleViewHref}>
                      {isReviewMode ? '← Back to List' : '→ Review Mode'}
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
                    ? s.href.replace('/space', '/space/review')
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
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => signOut()}
              className="w-full"
            >
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
              onClick={() => handleOAuthSignIn('google')}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              Sign in with Google
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOAuthSignIn('github')}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.207 11.387.6.11.82-.26.82-.58 0-.28-.01-1.02-.01-2.002-3.337.725-4.042-1.61-4.042-1.61-.546-1.387-1.334-1.757-1.334-1.757-1.09-.745.083-.73.083-.73 1.205.085 1.838 1.238 1.838 1.238 1.07 1.833 2.809 1.304 3.49.997.108-.775.418-1.304.762-1.604-2.665-.304-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.125-.304-.535-1.52.117-3.176 0 0 1.008-.323 3.301 1.23.957-.266 1.983-.4 3.003-.404 1.02.004 2.046.138 3.003.404 2.29-1.553 3.297-1.23 3.297-1.23.652 1.656.242 2.872.117 3.176.77.84 1.235 1.91 1.235 3.22 0 4.61-2.805 5.62-5.475 5.92.43.37.82 1.1.82 2.22 0 1.604-.01 2.896-.01 3.286 0 .32.21.69.825.57C20.565 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/>
                </svg>
              )}
              Sign in with GitHub
            </Button>
          </>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}