'use client';

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
  const usesMobileActionRail = pathname === '/space' || pathname === '/space/review';
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
      className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={isReviewLike ? 'Back to list' : 'Open review'}
    >
      {isReviewLike ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
      <span className="hidden sm:inline">{isReviewLike ? 'List' : 'Review'}</span>
      <SpaceLinkHint />
    </Link>
  );

  return (
    <header className="flex h-12 min-w-0 items-center gap-1.5 border-b border-border bg-background px-2 sm:gap-2 sm:px-4">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        aria-label="Toggle sidebar"
        title={`Toggle sidebar (${isMac ? '⌘' : 'Ctrl'} + B)`}
        onClick={() => toggleSidebar?.()}
      >
        <PanelLeft className="h-4 w-4" />
      </Button>

      <p className="min-w-0 flex-1 truncate px-1 text-xs text-muted-foreground sm:text-sm">
        {leftContent}
      </p>

      <div className="flex shrink-0 items-center gap-1">
        {centerContent ?? defaultCenterContent}

        {onEditorToggle ? (
          <button
            data-space-editor-trigger
            onClick={onEditorToggle}
            className={`${usesMobileActionRail ? 'hidden md:inline-flex' : 'inline-flex'} h-8 items-center gap-1.5 rounded-md px-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              isEditorOpen
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            title={`Toggle editor (${isMac ? '⌘' : 'Ctrl'} + I)`}
            aria-label="Toggle editor"
            aria-pressed={isEditorOpen}
            type="button"
          >
            <Code className="h-4 w-4" />
            <span className={usesMobileActionRail ? '' : 'hidden sm:inline'}>Editor</span>
          </button>
        ) : null}

        {rightContent}
      </div>
    </header>
  );
}
