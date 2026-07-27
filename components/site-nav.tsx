import { DiscordButton, NavMenu, NavThemeToggle, TimeLink } from '@/components/site-nav-interactive';
import { GitHubIcon } from '@/components/icons/github-icon';
import { RedditIcon } from '@/components/icons/reddit-icon';
import { Activity, Box, Brain, Sparkles, Twitter } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

type NavLinkItem = {
  href: string;
  label: string;
  icon: ReactNode;
  hoverClass: string;
  external?: boolean;
};

const lavenderHover =
  'hover:text-[#91889b] focus:text-[#91889b] dark:hover:text-[#cbc4d2] dark:focus:text-[#cbc4d2]';

const siteLinks: NavLinkItem[] = [
  {
    href: '/proxy-dashboard',
    label: 'proxy',
    icon: <Activity size={15} />,
    hoverClass: 'hover:text-emerald-600 focus:text-emerald-600 dark:hover:text-emerald-400 dark:focus:text-emerald-400',
  },
  {
    href: '/space',
    label: 'space',
    icon: <Brain size={15} />,
    hoverClass: lavenderHover,
  },
  {
    href: '/gallery',
    label: 'gallery',
    icon: <Box size={15} />,
    hoverClass: 'hover:text-foreground focus:text-foreground',
  },
  {
    href: 'https://glossless.app/',
    label: 'glossless',
    icon: <Sparkles size={15} />,
    hoverClass: lavenderHover,
    external: true,
  },
];

const socialLinks: NavLinkItem[] = [
  {
    href: 'https://twitter.com/teamleaderleo',
    label: 'twitter',
    icon: <Twitter size={16} />,
    hoverClass: 'hover:text-blue-500 focus:text-blue-500',
    external: true,
  },
  {
    href: 'https://www.reddit.com/user/TeamLeaderLeo/',
    label: 'reddit',
    icon: <RedditIcon className="h-4 w-4" />,
    hoverClass: 'hover:text-orange-500 focus:text-orange-500',
    external: true,
  },
  {
    href: 'https://github.com/teamleaderleo/',
    label: 'github',
    icon: <GitHubIcon className="h-4 w-4" />,
    hoverClass: 'hover:text-foreground focus:text-foreground',
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
      prefetch={item.external ? false : true}
      className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted focus:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${item.hoverClass}`}
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
      prefetch={item.external ? false : true}
      className={`flex items-center gap-1.5 rounded-sm text-sm font-medium text-muted-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${item.hoverClass}`}
    >
      <span className="shrink-0">{item.icon}</span>
      <span>{item.label}</span>
    </Link>
  );
}

function MenuLabel({ children }: { children: ReactNode }) {
  return (
    <p className="px-2.5 pb-1 pt-2 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
      {children}
    </p>
  );
}

export default function SiteNav() {
  return (
    <nav className="sticky top-0 z-50 min-w-0 border-b border-border/70 bg-background text-foreground shadow-[0_1px_0_rgba(255,255,255,0.22),0_8px_24px_rgba(20,20,24,0.08)] dark:shadow-[0_1px_0_rgba(255,255,255,0.04),0_10px_28px_rgba(0,0,0,0.28)]">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="flex h-12 min-w-0 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Link href="/" prefetch className="min-w-0 shrink truncate rounded-sm text-base font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:text-lg">
              teamleaderleo
            </Link>
            <TimeLink />
          </div>

          <div className="hidden min-w-0 items-center gap-5 lg:flex">
            <div className="flex items-center gap-4">
              {siteLinks.map((item) => (
                <InlineLink key={item.label} item={item} />
              ))}
            </div>
            <div className="h-5 border-l border-border/60" />
            <div className="flex items-center gap-4">
              {socialLinks.map((item) => (
                <InlineLink key={item.label} item={item} />
              ))}
              <DiscordButton />
            </div>
            <div className="h-5 border-l border-border/60" />
            <NavThemeToggle />
          </div>

          <div className="flex min-w-0 shrink-0 items-center gap-1.5 lg:hidden">
            <NavMenu label="menu">
              <MenuLabel>site</MenuLabel>
              {siteLinks.map((item) => (
                <MenuLink key={item.label} item={item} />
              ))}

              <div className="my-1 border-t" />
              <MenuLabel>social</MenuLabel>
              {socialLinks.map((item) => (
                <MenuLink key={item.label} item={item} />
              ))}
              <DiscordButton menu />

              <div className="my-1 border-t" />
              <div className="flex items-center justify-between gap-4 px-2.5 py-2">
                <span className="text-sm text-muted-foreground">appearance</span>
                <NavThemeToggle />
              </div>
            </NavMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
