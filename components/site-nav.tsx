"use client";

import Link from 'next/link';
import { toast } from 'sonner';
import { Activity, Book, Box, Brain, ChevronDown, FileText, Sparkles, Twitter } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { RedditIcon } from './icons/reddit-icon';
import { GitHubIcon } from './icons/github-icon';
import { DiscordIcon } from '@/components/icons/discord-icon';

type NavLinkItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  external?: boolean;
  className?: string;
};

const siteLinks: NavLinkItem[] = [
  { href: '/resume', label: 'resume', icon: <FileText size={15} /> },
  { href: '/space', label: 'space', icon: <Brain size={15} /> },
  { href: '/blog', label: 'blog', icon: <Book size={15} /> },
  { href: 'https://glossless.app/', label: 'glossless', icon: <Sparkles size={15} />, external: true },
  { href: '/gallery', label: 'cube', icon: <Box size={15} /> },
  { href: '/proxy-dashboard', label: 'proxy', icon: <Activity size={15} /> },
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

function MenuLink({ item }: { item: NavLinkItem }) {
  return (
    <Link
      href={item.href}
      target={item.external ? '_blank' : undefined}
      rel={item.external ? 'noopener noreferrer' : undefined}
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted hover:text-foreground focus:bg-muted focus:outline-none"
    >
      {item.icon}
      <span>{item.label}</span>
    </Link>
  );
}

function NavMenu({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&::-webkit-details-marker]:hidden">
        <span>{label}</span>
        <ChevronDown size={14} className="transition-transform group-open:rotate-180" />
      </summary>
      <div className="absolute right-0 top-full z-50 mt-2 w-44 rounded-xl border bg-background/95 p-1.5 shadow-xl backdrop-blur">
        {children}
      </div>
    </details>
  );
}

function DiscordMenuButton() {
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText('teamleaderleo');
        toast.success('Discord username copied!', {
          description: 'teamleaderleo',
        });
      }}
      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted hover:text-foreground focus:bg-muted focus:outline-none"
      title="Discord - Click to copy username"
      type="button"
    >
      <DiscordIcon className="h-4 w-4" />
      <span>discord</span>
    </button>
  );
}

export default function SiteNav() {
  return (
    <nav className="border-b bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="flex h-12 min-w-0 items-center justify-between gap-2">
          <Link href="/" className="min-w-0 shrink truncate text-base font-bold sm:text-lg">
            teamleaderleo
          </Link>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
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

            <div className="ml-1 border-l pl-1 sm:ml-2 sm:pl-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
