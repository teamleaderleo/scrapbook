"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
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
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { shortcuts } from "@/app/lib/sidebar-data";

export function AppSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("tags") || "";
  const isReviewMode = pathname === "/space/review";

  // Toggle between list and review view with same query
  const toggleViewHref = isReviewMode 
    ? `/space${currentQuery ? `?tags=${currentQuery}` : ''}`
    : `/space/review${currentQuery ? `?tags=${currentQuery}` : ''}`;

  return (
    <Sidebar className="flex flex-col h-screen">
      <SidebarHeader className="h-[48px] p-0 m-0 bg-white text-black">
        <div className="flex h-full items-center px-4">
          <Link href="/" className="text-lg font-bold leading-none">
            teamleaderleo
          </Link>
        </div>
      </SidebarHeader>
      <div className="h-px bg-gray-200" />

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
    </Sidebar>
  );
}