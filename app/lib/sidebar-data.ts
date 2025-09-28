import { Book, Code, Zap, Settings, FileText, Globe, Shield } from "lucide-react";

export const nav = [
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

// Example “shortcut queries” you can render just like nav items
export const shortcuts = [
  { label: "Easy Arrays", href: "/space?tags=leetcode+topic:array+diff:easy" },
  { label: "Google Hard", href: "/space?tags=leetcode+company:google+diff:hard" },
  { label: "Recently Updated", href: "/space?tags=leetcode+order:recent" },
];
