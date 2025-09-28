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
import { nav, shortcuts } from "@/app/lib/sidebar-data";

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
                {shortcuts.map(s => (
                  <SidebarMenuItem key={s.label}>
                    <SidebarMenuButton asChild className="justify-start gap-2 px-4 pl-6">
                      <Link href={s.href}>{s.label}</Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Regular nav sections */}
          <SidebarMenu>
            {nav.filter(s => s.standalone).map(s => (
              <SidebarMenuItem key={s.id}>
                <SidebarMenuButton asChild className="justify-start gap-2 px-4 pl-6">
                  <Link href={s.href!}>
                    <s.icon className="h-4 w-4" />
                    <span>{s.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>

          {nav.filter(s => !s.standalone).map(section => (
            <SidebarGroup key={section.id} className="mt-2">
              <SidebarGroupLabel className="flex items-center gap-2 px-4">
                <section.icon className="h-4 w-4" />
                <span>{section.title}</span>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items?.map(item => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild className="justify-start gap-2 px-4 pl-6">
                        <Link href={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
      </ScrollArea>
    </Sidebar>
  );
}
