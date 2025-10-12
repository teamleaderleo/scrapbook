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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { User, LogOut } from "lucide-react";
import { shortcuts } from "@/app/lib/sidebar-data";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { AuthModal } from "./auth-modal";
import { useItems } from '@/app/lib/contexts/item-context';

export function AppSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("tags") || "";
  const isReviewMode = pathname === "/space/review";
  const { isAdmin } = useItems();
  
  const { user, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Toggle between list and review view with same query
  const toggleViewHref = isReviewMode 
    ? `/space${currentQuery ? `?tags=${currentQuery}` : ''}`
    : `/space/review${currentQuery ? `?tags=${currentQuery}` : ''}`;

  return (
    <>
      <Sidebar className="flex flex-col h-screen">
        <SidebarHeader className="h-[48px] p-0 m-0 bg-white text-black">
          <div className="flex h-full items-center px-4">
            <Link href="/" className="text-lg font-bold leading-none">
              teamleaderleo
            </Link>
          </div>
        </SidebarHeader>
        <div className="h-px bg-gray-200" />
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
                    // Make shortcuts work for current view mode
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
        <SidebarFooter className="border-t p-4">
          {user ? (
            <div className="space-y-2">
              <div className="text-sm font-medium truncate" title={user.email}>
                {user.email}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => signOut()}
                className="w-full justify-start gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          ) : (
            <Button 
              variant="default" 
              size="sm"
              onClick={() => setShowAuthModal(true)}
              className="w-full justify-start gap-2"
            >
              <User className="w-4 h-4" />
              Sign In
            </Button>
          )}
        </SidebarFooter>
      </Sidebar>
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
}