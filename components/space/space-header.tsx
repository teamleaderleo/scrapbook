"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useSearchParams, usePathname } from "next/navigation";
import { useSidebar } from "@/components/ui/sidebar";
import { PanelLeft } from "lucide-react";

interface SpaceHeaderProps {
  // Left side info
  leftContent: React.ReactNode;

  // Center action (optional, defaults to toggle)
  centerContent?: React.ReactNode;

  // Right side actions (optional). If omitted, we show the hotkey hint.
  rightContent?: React.ReactNode;
}

export function SpaceHeader({ leftContent, centerContent, rightContent }: SpaceHeaderProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();

  const tagsParam = searchParams.get("tags") || "";
  const isReviewMode = pathname === "/space/review";

  // Safe platform check for SSR
  const isMac = useMemo(
    () => (typeof navigator !== "undefined" && /Mac|iPhone|iPad/i.test(navigator.platform)),
    []
  );

  // Toggle between list and review view with same query
  const toggleHref = isReviewMode
    ? `/space${tagsParam ? `?tags=${tagsParam}` : ""}`
    : `/space/review${tagsParam ? `?tags=${tagsParam}` : ""}`;

  const defaultCenterContent = (
    <Link
      href={toggleHref}
      className="text-sm text-primary-foreground hover:text-primary-foreground/70 transition-colors font-medium"
    >
      {isReviewMode ? "← Back to List" : "→ Review Mode"}
    </Link>
  );

  const defaultRightContent = (
    <div className="hidden sm:flex items-center gap-1 text-muted-foreground">
      <div className="flex gap-1">
        <kbd className="px-1.5 py-0.5 text-xs font-semibold border rounded bg-background">
          {isMac ? "⌘" : "Ctrl"}
        </kbd>
        <kbd className="px-1.5 py-0.5 text-xs font-semibold border rounded bg-background">
          B
        </kbd>
      </div>
    </div>
  );

  return (
    <div className="bg-background px-6 h-12 relative border-b border-border">
      <div className="flex items-center justify-between h-full">
        {/* LEFT: toggle button, then our leftContent */}
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            aria-label="Toggle sidebar"
            title={`Toggle sidebar (${isMac ? "⌘" : "Ctrl"} + B)`}
            onClick={() => toggleSidebar?.()}
          >
            <PanelLeft className="h-4 w-4" />
          </Button>

          <p className="text-sm text-muted-foreground truncate">
            {leftContent}
          </p>
        </div>

        {/* CENTER: exactly centered in viewport */}
        <div className="fixed left-1/2 -translate-x-1/2 z-10">
          {centerContent ?? defaultCenterContent}
        </div>

        {/* RIGHT: hotkey hint (or custom rightContent) */}
        <div className="flex-1 flex justify-end gap-2">
          {rightContent ?? defaultRightContent}
        </div>
      </div>
    </div>
  );
}
