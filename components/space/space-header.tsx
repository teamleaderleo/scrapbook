'use client';

import { SiteAtlas } from '@/components/site-atlas';
import Link from 'next/link';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { usePathname, useSearchParams } from 'next/navigation';
import { useSidebar } from '@/components/ui/sidebar';
import { ArrowLeft, ArrowRight, Code, PanelLeft } from 'lucide-react';
import { SpaceLinkHint } from '@/components/space/space-link-hint';

interface SpaceHeaderProps {
  leftContent: React.ReactNode;
  centerContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  onEditorToggle?: () => void;
  isEditorOpen?: boolean;
}

export function SpaceHeader({
  leftContent,
  centerContent,
  rightContent,
  onEditorToggle,
  isEditorOpen = false,
}: SpaceHeaderProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();
  const tagsParam = searchParams.get('tags') || '';
  const isReviewLike =
    pathname === '/space/review' ||
    pathname?.startsWith('/space/add') ||
    pathname?.startsWith('/space/edit');
  const isMac = useMemo(
    () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform),
    [],
  );
  const toggleHref = isReviewLike
    ? `/space${tagsParam ? `?tags=${tagsParam}` : ''}`
    : `/space/review${tagsParam ? `?tags=${tagsParam}` : ''}`;

  const defaultCenterContent = (
    <Link
      href={toggleHref}
      prefetch
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-transparent px-2 text-sm font-medium text-muted-foreground transition hover:border-border/60 hover:bg-muted/65 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={isReviewLike ? 'Back to list' : 'Open review'}
    >
      {isReviewLike ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
      <span className="hidden sm:inline">{isReviewLike ? 'Clippings' : 'Review drawer'}</span>
      <SpaceLinkHint />
    </Link>
  );

  return (
    <header className="flex h-12 min-w-0 items-center gap-1.5 border-b border-dashed border-border/75 bg-background/88 px-2 backdrop-blur-sm sm:gap-2 sm:px-4">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 rounded-lg"
        aria-label="Toggle sidebar"
        title={`Toggle sidebar (${isMac ? '⌘' : 'Ctrl'} + B)`}
        onClick={() => toggleSidebar?.()}
      >
        <PanelLeft className="h-4 w-4" />
      </Button>

      <SiteAtlas variant="icon" className="rounded-lg" />

      <p className="min-w-0 flex-1 truncate px-1 font-mono text-[9px] font-semibold uppercase tracking-[0.13em] text-muted-foreground sm:text-[10px]">
        {leftContent}
      </p>

      <div className="flex shrink-0 items-center gap-1">
        {centerContent ?? defaultCenterContent}

        {onEditorToggle ? (
          <button
            onClick={onEditorToggle}
            className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              isEditorOpen
                ? 'border-border bg-muted text-foreground'
                : 'border-transparent text-muted-foreground hover:border-border/60 hover:bg-muted/65 hover:text-foreground'
            }`}
            title={`Toggle editor (${isMac ? '⌘' : 'Ctrl'} + I)`}
            aria-label="Toggle editor"
            aria-pressed={isEditorOpen}
            type="button"
          >
            <Code className="h-4 w-4" />
            <span className="hidden sm:inline">Editor</span>
          </button>
        ) : null}

        {rightContent}
      </div>
    </header>
  );
}
