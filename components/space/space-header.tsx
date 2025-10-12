"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSearchParams, usePathname } from "next/navigation";

interface SpaceHeaderProps {
  // Left side info
  leftContent: React.ReactNode;
  
  // Right side actions (optional)
  rightContent?: React.ReactNode;
}

export function SpaceHeader({ leftContent, rightContent }: SpaceHeaderProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const tagsParam = searchParams.get("tags") || "";
  const isReviewMode = pathname === "/space/review";

  // Toggle between list and review view with same query
  const toggleHref = isReviewMode 
    ? `/space${tagsParam ? `?tags=${tagsParam}` : ''}`
    : `/space/review${tagsParam ? `?tags=${tagsParam}` : ''}`;

  return (
    <div className="bg-background px-6 h-12 relative border-b border-border">
      <div className="flex items-center justify-between h-full">
        {/* Left: Query/Index info */}
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">
            {leftContent}
          </p>
        </div>

        {/* Center: Toggle view mode - absolutely positioned to center on viewport */}
        <div className="fixed left-1/2 -translate-x-1/2 z-10">
          <Link 
            href={toggleHref}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isReviewMode ? '← Back to List' : '→ Review Mode'}
          </Link>
        </div>

        {/* Right: Additional actions */}
        <div className="flex-1 flex justify-end gap-2">
          {rightContent}
        </div>
      </div>
    </div>
  );
}