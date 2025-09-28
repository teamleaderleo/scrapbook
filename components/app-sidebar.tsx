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
import { Book, Code, Zap, Settings, FileText, Globe, Shield } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const nav = [
  { id: "configuration", title: "Configuration", icon: Settings, href: "#configuration", standalone: true },
  {
    id: "api-reference",
    title: "API Reference",
    icon: Code,
    items: [
      { title: "Authentication", href: "#auth", icon: Shield },
      { title: "Endpoints", href: "#endpoints", icon: Globe },
      { title: "Error Codes", href: "#errors", icon: FileText },
      { title: "Rate Limiting", href: "#limits", icon: Settings },
    ],
  },
  {
    id: "guides",
    title: "Guides",
    icon: Book,
    items: [
      { title: "Best Practices", href: "#best-practices", icon: Book },
      { title: "Common Patterns", href: "#patterns", icon: Code },
      { title: "Troubleshooting", href: "#troubleshooting", icon: Settings },
    ],
  },
  {
    id: "advanced",
    title: "Advanced",
    icon: Zap,
    items: [
      { title: "Custom Integrations", href: "#integrations", icon: Globe },
      { title: "Webhooks", href: "#webhooks", icon: Code },
      { title: "SDKs", href: "#sdks", icon: FileText },
    ],
  },
];

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
          <SidebarMenu>
            {nav.filter((s) => s.standalone).map((s) => (
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

          {nav
            .filter((s) => !s.standalone)
            .map((section) => (
              <SidebarGroup key={section.id} className="mt-2">
                <SidebarGroupLabel className="flex items-center gap-2 px-4">
                  <section.icon className="h-4 w-4" />
                  <span>{section.title}</span>
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items?.map((item) => (
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

          {Array.from({ length: 12 }).map((_, i) => (
            <SidebarGroup key={`extra-${i}`} className="mt-2">
              <SidebarGroupLabel className="px-4">Extra Section {i + 1}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {["Item A", "Item B", "Item C"].map((label) => (
                    <SidebarMenuItem key={label}>
                      <SidebarMenuButton className="justify-start gap-2 px-4 pl-6">
                        <span className="h-4 w-4 inline-block">•</span>
                        <span>{label}</span>
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
