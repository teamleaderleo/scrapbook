"use client";

import Link from "next/link";
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
          <SidebarGroup>
            <SidebarGroupLabel className="px-4">Shortcuts</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {shortcuts.map((s) => (
                  <SidebarMenuItem key={s.label}>
                    <SidebarMenuButton asChild className="justify-start gap-2 px-4 pl-6">
                      <Link href={s.href}>{s.label}</Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </ScrollArea>
    </Sidebar>
  );
}
