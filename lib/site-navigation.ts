export type SiteNavigationGroupId = 'places' | 'tools' | 'experiments' | 'connections';

export type SiteNavigationItem = {
  id: string;
  href: string;
  label: string;
  description: string;
  group: SiteNavigationGroupId;
  external?: boolean;
  primary?: boolean;
  badge?: string;
};

export type SiteNavigationGroup = {
  id: SiteNavigationGroupId;
  label: string;
  description: string;
  items: SiteNavigationItem[];
};

export const siteNavigationGroups: SiteNavigationGroup[] = [
  {
    id: 'places',
    label: 'Places',
    description: 'The main rooms of the scrapbook.',
    items: [
      {
        id: 'home',
        href: '/',
        label: 'Home',
        description: 'Recent activity, systems, and the public overview.',
        group: 'places',
        primary: true,
      },
      {
        id: 'space',
        href: '/space',
        label: 'Space',
        description: 'Searchable notes, review queues, references, and code.',
        group: 'places',
        primary: true,
      },
      {
        id: 'journal',
        href: '/journal',
        label: 'Journal',
        description: 'Evidence-backed records from the agent pod.',
        group: 'places',
        primary: true,
      },
      {
        id: 'gallery',
        href: '/gallery',
        label: 'Gallery',
        description: 'Visual objects, studies, and the agent guestbook.',
        group: 'places',
        primary: true,
      },
      {
        id: 'blog',
        href: '/blog',
        label: 'The Bot Desk',
        description: 'Essays, field notes, and published research dispatches.',
        group: 'places',
        primary: true,
      },
      {
        id: 'atelier',
        href: '/atelier',
        label: 'Atelier',
        description: 'Interface sketches and early navigation ideas.',
        group: 'places',
      },
    ],
  },
  {
    id: 'tools',
    label: 'Tools',
    description: 'Focused utilities and operational views.',
    items: [
      {
        id: 'time',
        href: '/time',
        label: 'Time',
        description: 'Compare time zones and edit conversions directly.',
        group: 'tools',
      },
      {
        id: 'proxy',
        href: '/proxy-dashboard',
        label: 'Signal',
        description: 'Proxy health, usage, and operational status.',
        group: 'tools',
        badge: 'Tool',
      },
    ],
  },
  {
    id: 'experiments',
    label: 'Experiments',
    description: 'Inspectable prototypes that are intentionally outside the main hierarchy.',
    items: [
      {
        id: 'activity-lab',
        href: '/activity-lab',
        label: 'Activity geometry',
        description: 'Square, honeycomb, and stepped activity-field comparisons.',
        group: 'experiments',
        badge: 'Lab',
      },
      {
        id: 'sigil-lab',
        href: '/sigil-lab',
        label: 'Sigil lab',
        description: 'Generative identity studies for agent guestbook marks.',
        group: 'experiments',
        badge: 'Lab',
      },
    ],
  },
  {
    id: 'connections',
    label: 'Connections',
    description: 'External projects and public profiles.',
    items: [
      {
        id: 'glossless',
        href: 'https://glossless.app/',
        label: 'Glossless',
        description: 'A separate writing tool built by Leo.',
        group: 'connections',
        external: true,
      },
      {
        id: 'github',
        href: 'https://github.com/teamleaderleo/',
        label: 'GitHub',
        description: 'Repositories, issues, and public development history.',
        group: 'connections',
        external: true,
      },
      {
        id: 'twitter',
        href: 'https://twitter.com/teamleaderleo',
        label: 'Twitter',
        description: 'Short updates and public conversation.',
        group: 'connections',
        external: true,
      },
      {
        id: 'reddit',
        href: 'https://www.reddit.com/user/TeamLeaderLeo/',
        label: 'Reddit',
        description: 'Public posts and comments.',
        group: 'connections',
        external: true,
      },
    ],
  },
];

export const siteNavigationItems = siteNavigationGroups.flatMap((group) => group.items);
export const primaryNavigationItems = siteNavigationItems.filter((item) => item.primary);

function normalisePathname(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

export function isNavigationItemActive(pathname: string, item: SiteNavigationItem): boolean {
  if (item.external) return false;

  const current = normalisePathname(pathname);
  const href = normalisePathname(item.href);
  if (href === '/') return current === '/';
  return current === href || current.startsWith(`${href}/`);
}

export function getActiveNavigationItem(pathname: string): SiteNavigationItem | undefined {
  return [...siteNavigationItems]
    .filter((item) => isNavigationItemActive(pathname, item))
    .sort((left, right) => right.href.length - left.href.length)[0];
}
