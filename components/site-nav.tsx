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
    hoverClass: 'hover:text-emerald-500 focus:text-emerald-500',
  },
  {
    href: '/space',
    label: 'space',
    icon: <Brain size={15} />,
    hoverClass: lavenderHover,
  },
  {
    href: '/gallery',
    label: 'cube',
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
      className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted focus:bg-muted focus:outline-none ${item.hoverClass}`}
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
      className={`flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors focus:outline-none ${item.hoverClass}`}
    >
      <span className="shrink-0">{item.icon}</span>
      <span>{item.label}</span>
    </Link>
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
            <TimeLink />
            <div className="h-5 border-l" />
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
              <DiscordButton />
            </div>
            <div className="h-5 border-l" />
            <NavThemeToggle />
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2 lg:hidden">
            <TimeLink />

            <NavMenu label="site">
              {siteLinks.map((item) => (
                <MenuLink key={item.label} item={item} />
              ))}
            </NavMenu>

            <NavMenu label="socials">
              {socialLinks.map((item) => (
                <MenuLink key={item.label} item={item} />
              ))}
              <DiscordButton menu />
            </NavMenu>

            <div className="ml-0.5 border-l pl-1 sm:ml-2 sm:pl-2">
              <NavThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
