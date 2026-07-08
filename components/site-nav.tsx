"use client";

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Activity, Box, Brain, ChevronDown, Sparkles, Twitter } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { RedditIcon } from './icons/reddit-icon';
import { GitHubIcon } from './icons/github-icon';
import { DiscordIcon } from '@/components/icons/discord-icon';

type NavLinkItem = {
  href: string;
  label: string;
  icon: ReactNode;
  external?: boolean;
};

const siteLinks: NavLinkItem[] = [
  { href: '/proxy-dashboard', label: 'proxy', icon: <Activity size={15} /> },
  { href: '/space', label: 'space', icon: <Brain size={15} /> },
  { href: '/gallery', label: 'cube', icon: <Box size={15} /> },
  { href: 'https://glossless.app/', label: 'glossless', icon: <Sparkles size={15} />, external: true },
];

const socialLinks: NavLinkItem[] = [
  {
    href: 'https://twitter.com/teamleaderleo',
    label: 'twitter',
    icon: <Twitter size={16} />,
    external: true,
  },
  {
    href: 'https://www.reddit.com/user/TeamLeaderLeo/',
    label: 'reddit',
    icon: <RedditIcon className="h-4 w-4" />,
    external: true,
  },
  {
    href: 'https://github.com/teamleaderleo/',
    label: 'github',
    icon: <GitHubIcon className="h-4 w-4" />,
    external: true,
  },
];

function navLinkProps(item: NavLinkItem) {
  return {
    href: item.href,
    target: item.external ? '_blank' : undefined,
    rel: item.external ? 'noopener noreferrer' : undefined,
  };
}

function MenuLink({ item }: { item: NavLinkItem }) {
  return (
    <Link
      {...navLinkProps(item)}
      className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-muted hover:text-foreground focus:bg-muted focus:outline-none"
    >
      <span className="shrink-0">{item.icon}</span>
      <span className="whitespace-nowrap">{item.label}</span>
    </Link>
  );
}

function InlineLink({ item }: { item: NavLinkItem }) {
  return (
    <Link
      {...navLinkProps(item)}
      className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:text-foreground"
    >
      <span className="shrink-0 opacity-80">{item.icon}</span>
      <span>{item.label}</span>
    </Link>
  );
}

function NavMenu({ label, children }: { label: string; children: ReactNode }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function closeOnOutsideTap(event: PointerEvent) {
      const details = detailsRef.current;
      if (!details?.open) return;
      if (event.target instanceof Node && details.contains(event.target)) return;
      details.open = false;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && detailsRef.current?.open) {
        detailsRef.current.open = false;
      }
    }

    document.addEventListener('pointerdown', closeOnOutsideTap);
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideTap);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  return (
    <details ref={detailsRef} className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-1 rounded-full px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&::-webkit-details-marker]:hidden">
        <span>{label}</span>
        <ChevronDown size={14} className="transition-transform group-open:rotate-180" />
      </summary>
      <div className="absolute right-0 top-full z-50 mt-2 w-max min-w-[8.5rem] rounded-xl border bg-background/95 p-1 shadow-xl backdrop-blur">
        {children}
      </div>
    </details>
  );
}

function copyDiscord() {
  navigator.clipboard.writeText('teamleaderleo');
  toast.success('Discord username copied!', {
    description: 'teamleaderleo',
  });
}

function DiscordMenuButton() {
  return (
    <button
      onClick={copyDiscord}
      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted hover:text-foreground focus:bg-muted focus:outline-none"
      title="Discord - Click to copy username"
      type="button"
    >
      <DiscordIcon className="h-4 w-4 shrink-0" />
      <span className="whitespace-nowrap">discord</span>
    </button>
  );
}

function DiscordInlineButton() {
  return (
    <button
      onClick={copyDiscord}
      className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:text-foreground"
      type="button"
    >
      <DiscordIcon className="h-4 w-4 shrink-0 opacity-80" />
      <span>discord</span>
    </button>
  );
}

export default function SiteNav() {
  return (
    <nav className="border-b bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="flex h-12 min-w-0 items-center justify-between gap-3">
          <Link href="/" className="min-w-0 shrink truncate text-base font-bold sm:text-lg">
            teamleaderleo
          </Link>

          <div className="hidden min-w-0 items-center gap-5 lg:flex">
            <div className="flex items-center gap-4">
              {siteLinks.map((item) => (
                <InlineLink key={item.label} item={item} />
              ))}
            </div>

            <div className="h-5 border-l" />

            <div className="flex items-center gap-4">
              {socialLinks.map((item) => (
                <InlineLink key={item.label} item={item} />
              ))}
              <DiscordInlineButton />
            </div>

            <div className="h-5 border-l" />
            <ThemeToggle />
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2 lg:hidden">
            <NavMenu label="site">
              {siteLinks.map((item) => (
                <MenuLink key={item.label} item={item} />
              ))}
            </NavMenu>

            <NavMenu label="socials">
              {socialLinks.map((item) => (
                <MenuLink key={item.label} item={item} />
              ))}
              <DiscordMenuButton />
            </NavMenu>

            <div className="ml-0.5 border-l pl-1 sm:ml-2 sm:pl-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
