'use client';

import { DiscordIcon } from '@/components/icons/discord-icon';
import { GitHubIcon } from '@/components/icons/github-icon';
import { RedditIcon } from '@/components/icons/reddit-icon';
import {
  isNavigationItemActive,
  siteNavigationGroups,
  type SiteNavigationItem,
} from '@/lib/site-navigation';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Activity,
  BookOpenText,
  Brain,
  Clock3,
  Compass,
  ExternalLink,
  FlaskConical,
  Home,
  Images,
  LibraryBig,
  NotebookPen,
  Moon,
  Palette,
  Shapes,
  Snowflake,
  Sparkles,
  Sun,
  Twitter,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

const triggerBase =
  'inline-flex h-11 min-w-[44px] shrink-0 items-center justify-center gap-1.5 rounded-full border border-border/70 bg-card px-3 text-xs font-semibold text-foreground shadow-[0_3px_10px_rgba(20,20,24,0.08)] transition-[background-color,box-shadow] hover:bg-muted hover:shadow-[0_6px_14px_rgba(20,20,24,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none dark:shadow-[0_4px_12px_rgba(0,0,0,0.28)]';

function ItemIcon({ id }: { id: string }) {
  const className = 'h-4 w-4';
  switch (id) {
    case 'home':
      return <Home className={className} aria-hidden="true" />;
    case 'space':
      return <Brain className={className} aria-hidden="true" />;
    case 'gallery':
      return <Images className={className} aria-hidden="true" />;
    case 'journal':
      return <NotebookPen className={className} aria-hidden="true" />;
    case 'atelier':
      return <Palette className={className} aria-hidden="true" />;
    case 'time':
      return <Clock3 className={className} aria-hidden="true" />;
    case 'proxy':
      return <Activity className={className} aria-hidden="true" />;
    case 'snow-globe':
      return <Snowflake className={className} aria-hidden="true" />;
    case 'activity-lab':
      return <FlaskConical className={className} aria-hidden="true" />;
    case 'sigil-lab':
      return <Shapes className={className} aria-hidden="true" />;
    case 'glossless':
      return <Sparkles className={className} aria-hidden="true" />;
    case 'scrapbook-repository':
      return <LibraryBig className={className} aria-hidden="true" />;
    case 'fieldwork-repository':
    case 'linux-fieldwork-repository':
    case 'smolrunner-repository':
      return <BookOpenText className={className} aria-hidden="true" />;
    case 'github':
      return <GitHubIcon className={className} aria-hidden="true" />;
    case 'twitter':
      return <Twitter className={className} aria-hidden="true" />;
    case 'reddit':
      return <RedditIcon className={className} aria-hidden="true" />;
    default:
      return <Compass className={className} aria-hidden="true" />;
  }
}

function AtlasLink({
  item,
  pathname,
}: {
  item: SiteNavigationItem;
  pathname: string;
}) {
  const active = isNavigationItemActive(pathname, item);
  const link = (
    <Link
      href={item.href}
      prefetch={item.external ? false : true}
      target={item.external ? '_blank' : undefined}
      rel={item.external ? 'noopener noreferrer' : undefined}
      aria-current={active ? 'page' : undefined}
      data-site-atlas-link={item.id}
      data-active={active ? 'true' : undefined}
      className={`group flex min-h-16 min-w-0 items-start gap-2.5 rounded-[0.9rem] border px-3 py-2.5 text-left transition-[background-color,border-color,transform] hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transform-none ${
        active
          ? 'border-foreground/30 bg-foreground/[0.075]'
          : 'border-border/70 bg-background/55 hover:border-foreground/25 hover:bg-muted/70'
      }`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-card text-foreground">
        <ItemIcon id={item.id} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold leading-tight text-foreground">
          {item.label}
        </span>
        <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
          {item.description}
        </span>
      </span>
      {item.badge ? (
        <span className="shrink-0 rounded-full border border-border/70 px-1.5 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {item.badge}
        </span>
      ) : null}
      {item.external ? (
        <ExternalLink
          className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      ) : null}
      {item.external ? (
        <span className="sr-only"> Opens in a new tab.</span>
      ) : null}
    </Link>
  );

  return item.external ? link : <Dialog.Close asChild>{link}</Dialog.Close>;
}

function AppearanceAction() {
  const { setTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={() => {
        const isDark = document.documentElement.classList.contains('dark');
        setTheme(isDark ? 'light' : 'dark');
      }}
      data-site-atlas-appearance
      className="flex min-h-16 w-full items-start gap-2.5 rounded-[0.9rem] border border-border/70 bg-background/55 px-3 py-2.5 text-left transition-[background-color,transform] hover:-translate-y-px hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transform-none"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-card">
        <Sun className="h-4 w-4 dark:hidden" aria-hidden="true" />
        <Moon className="hidden h-4 w-4 dark:block" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-base font-semibold leading-tight">
          Appearance
        </span>
        <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
          Switch light or dark theme.
        </span>
      </span>
    </button>
  );
}

async function copyDiscord() {
  try {
    await navigator.clipboard.writeText('teamleaderleo');
    toast.success('Discord username copied', { description: 'teamleaderleo' });
  } catch {
    toast.error('Could not copy the Discord username', {
      description: 'teamleaderleo',
    });
  }
}

function DiscordAction() {
  return (
    <button
      type="button"
      onClick={() => void copyDiscord()}
      data-site-atlas-discord
      className="flex min-h-16 w-full items-start gap-2.5 rounded-[0.9rem] border border-border/70 bg-background/55 px-3 py-2.5 text-left transition-[background-color,transform] hover:-translate-y-px hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transform-none"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-card">
        <DiscordIcon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-base font-semibold leading-tight">
          Discord
        </span>
        <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
          Copy teamleaderleo.
        </span>
      </span>
    </button>
  );
}

export function SiteAtlas({
  variant = 'label',
  className = '',
}: {
  variant?: 'label' | 'icon' | 'rail';
  className?: string;
}) {
  const pathname = usePathname() || '/';

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className={`${
            variant === 'rail'
              ? 'inline-flex h-12 min-w-[44px] shrink-0 items-center justify-center gap-1.5 border-l border-border/60 bg-transparent px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted/75 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring motion-reduce:transition-none'
              : triggerBase
          } ${variant === 'icon' ? 'w-11 px-0' : ''} ${className}`}
          aria-label="Open site atlas"
          title="Open site atlas"
          data-site-atlas-trigger
        >
          <Compass className="h-4 w-4" aria-hidden="true" />
          {variant !== 'icon' ? (
            <span className="hidden min-[420px]:inline">Atlas</span>
          ) : null}
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-[70] bg-black/60 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 motion-reduce:animate-none"
          data-site-atlas-overlay
        />
        <Dialog.Content
          className="fixed inset-0 z-[80] flex min-w-0 flex-col overflow-hidden bg-background text-foreground shadow-2xl outline-none [contain:layout_paint] data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 motion-reduce:animate-none sm:inset-4 sm:mx-auto sm:max-w-6xl sm:rounded-[1.5rem] sm:border sm:border-border/70 lg:inset-y-6"
          data-site-atlas
        >
          <header className="flex shrink-0 items-start gap-4 border-b border-border/70 bg-card/90 px-4 py-[max(1rem,env(safe-area-inset-top))] sm:px-6 sm:py-5">
            <div className="min-w-0 flex-1">
              <Dialog.Title className="text-3xl font-semibold tracking-[-0.03em]">
                Atlas
              </Dialog.Title>
              <Dialog.Description className="mt-1 max-w-2xl text-sm leading-5 text-muted-foreground">
                Routes, repositories, and external profiles.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Close site atlas"
                data-site-atlas-close
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </Dialog.Close>
          </header>

          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-6"
            data-site-atlas-scroll
          >
            <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
              {siteNavigationGroups.map(group => (
                <section
                  key={group.id}
                  aria-labelledby={`site-atlas-${group.id}`}
                  className="min-w-0"
                >
                  <h2
                    id={`site-atlas-${group.id}`}
                    className="mb-0.5 text-lg font-semibold tracking-[-0.02em] text-foreground"
                  >
                    {group.label}
                  </h2>
                  <p className="mb-2.5 text-xs leading-5 text-muted-foreground">
                    {group.description}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {group.items.map(item => (
                      <AtlasLink
                        key={item.id}
                        item={item}
                        pathname={pathname}
                      />
                    ))}
                    {group.id === 'connections' ? (
                      <>
                        <DiscordAction />
                        <AppearanceAction />
                      </>
                    ) : null}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
