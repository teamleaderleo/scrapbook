export type SiteNavigationGroupId =
  | 'places'
  | 'tools'
  | 'experiments'
  | 'repositories'
  | 'connections';

export type SiteSurface =
  | 'public'
  | 'private'
  | 'experimental'
  | 'operational'
  | 'external';

export type SiteSitemapEntry = {
  changeFrequency: 'weekly' | 'monthly';
  priority: number;
};

export type SiteNavigationItem = {
  id: string;
  href: string;
  label: string;
  description: string;
  group: SiteNavigationGroupId;
  surface: SiteSurface;
  external?: boolean;
  primary?: boolean;
  homeShelf?: boolean;
  badge?: string;
  sitemap?: SiteSitemapEntry;
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
    description: 'Public routes.',
    items: [
      {
        id: 'home',
        href: '/',
        label: 'Home',
        description: 'Operator console, activity, and repositories.',
        group: 'places',
        surface: 'public',
        primary: true,
        sitemap: { changeFrequency: 'weekly', priority: 1 },
      },
      {
        id: 'operator',
        href: '/operator',
        label: 'Operator',
        description: 'Copyable steering phrases for agents and models.',
        group: 'places',
        surface: 'public',
        sitemap: { changeFrequency: 'weekly', priority: 0.9 },
      },
      {
        id: 'space',
        href: '/space',
        label: 'Space',
        description: 'Public notes, questions, and code.',
        group: 'places',
        surface: 'public',
        primary: true,
        homeShelf: true,
        sitemap: { changeFrequency: 'weekly', priority: 0.8 },
      },
      {
        id: 'work',
        href: '/work',
        label: 'Work',
        description: 'Selected engineering work and its evidence.',
        group: 'places',
        surface: 'public',
        primary: true,
        homeShelf: true,
        sitemap: { changeFrequency: 'weekly', priority: 0.8 },
      },
      {
        id: 'gallery',
        href: '/gallery',
        label: 'Gallery',
        description: 'Artwork and the agent guestbook.',
        group: 'places',
        surface: 'public',
        primary: true,
        homeShelf: true,
        sitemap: { changeFrequency: 'monthly', priority: 0.5 },
      },
      {
        id: 'desk',
        href: '/desk',
        label: 'Workbench',
        description: 'Selected essays and technical dispatches.',
        group: 'places',
        surface: 'public',
        primary: true,
        homeShelf: true,
        sitemap: { changeFrequency: 'weekly', priority: 0.7 },
      },
      {
        id: 'journal',
        href: '/journal',
        label: 'Journal',
        description: 'Evidence-backed agent records.',
        group: 'places',
        surface: 'public',
        sitemap: { changeFrequency: 'weekly', priority: 0.4 },
      },
      {
        id: 'atelier',
        href: '/atelier',
        label: 'Atelier',
        description: 'Interface experiments.',
        group: 'places',
        surface: 'experimental',
        homeShelf: true,
        badge: 'Workshop',
      },
    ],
  },
  {
    id: 'tools',
    label: 'Tools',
    description: 'Utilities and status.',
    items: [
      {
        id: 'time',
        href: '/time',
        label: 'Time',
        description: 'Local time and time zones.',
        group: 'tools',
        surface: 'public',
        sitemap: { changeFrequency: 'monthly', priority: 0.7 },
      },
      {
        id: 'proxy',
        href: '/proxy-dashboard',
        label: 'Signal',
        description: 'Proxy health and usage.',
        group: 'tools',
        surface: 'operational',
      },
    ],
  },
  {
    id: 'experiments',
    label: 'Experiments',
    description: 'Prototypes.',
    items: [
      {
        id: 'snow-globe',
        href: '/snow-globe',
        label: 'Snow globe',
        description: 'Interactive 3D scene.',
        group: 'experiments',
        surface: 'experimental',
        homeShelf: true,
      },
      {
        id: 'activity-lab',
        href: '/activity-lab',
        label: 'Activity geometry',
        description: 'Calendar layout studies.',
        group: 'experiments',
        surface: 'experimental',
        badge: 'Lab',
      },
      {
        id: 'sigil-lab',
        href: '/sigil-lab',
        label: 'Sigil lab',
        description: 'Generated identity studies.',
        group: 'experiments',
        surface: 'experimental',
        badge: 'Lab',
      },
    ],
  },
  {
    id: 'repositories',
    label: 'Repositories',
    description: 'Source repositories.',
    items: [
      {
        id: 'scrapbook-repository',
        href: 'https://github.com/teamleaderleo/scrapbook',
        label: 'Scrapbook',
        description: 'Source for this site.',
        group: 'repositories',
        surface: 'external',
        external: true,
      },
      {
        id: 'fieldwork-repository',
        href: 'https://github.com/teamleaderleo/fieldwork',
        label: 'Fieldwork',
        description: 'Codebase investigations and contributions.',
        group: 'repositories',
        surface: 'external',
        external: true,
      },
      {
        id: 'linux-fieldwork-repository',
        href: 'https://github.com/teamleaderleo/linux-fieldwork',
        label: 'Linux fieldwork',
        description: 'Linux and kernel studies.',
        group: 'repositories',
        surface: 'external',
        external: true,
      },
      {
        id: 'smolrunner-repository',
        href: 'https://github.com/teamleaderleo/smolrunner',
        label: 'Smolrunner',
        description: 'Host-work runner.',
        group: 'repositories',
        surface: 'external',
        external: true,
      },
    ],
  },
  {
    id: 'connections',
    label: 'Connections',
    description: 'Profiles and external work.',
    items: [
      {
        id: 'glossless',
        href: 'https://glossless.app/',
        label: 'Glossless',
        description: 'AI-assisted 3D pose-reference tool.',
        group: 'connections',
        surface: 'external',
        external: true,
      },
      {
        id: 'github',
        href: 'https://github.com/teamleaderleo/',
        label: 'GitHub',
        description: 'Repositories and public development history.',
        group: 'connections',
        surface: 'external',
        external: true,
      },
      {
        id: 'twitter',
        href: 'https://twitter.com/teamleaderleo',
        label: 'Twitter',
        description: 'Public updates.',
        group: 'connections',
        surface: 'external',
        external: true,
      },
      {
        id: 'reddit',
        href: 'https://www.reddit.com/user/TeamLeaderLeo/',
        label: 'Reddit',
        description: 'Public posts and comments.',
        group: 'connections',
        surface: 'external',
        external: true,
      },
    ],
  },
];

export const siteNavigationItems = siteNavigationGroups.flatMap(
  group => group.items
);
export const primaryNavigationItems = siteNavigationItems.filter(
  item => item.primary
);
export const homeRoomNavigationItems = siteNavigationItems.filter(
  item => item.homeShelf
);
export const indexedNavigationItems = siteNavigationItems.filter(
  (item): item is SiteNavigationItem & { sitemap: SiteSitemapEntry } =>
    Boolean(item.sitemap)
);
export const nonPublicNavigationItems = siteNavigationItems.filter(
  item => item.surface === 'private' || item.surface === 'operational'
);

function normalisePathname(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

export function isNavigationItemActive(
  pathname: string,
  item: SiteNavigationItem
): boolean {
  if (item.external) return false;

  const current = normalisePathname(pathname);
  const href = normalisePathname(item.href);
  if (href === '/') return current === '/';
  return current === href || current.startsWith(`${href}/`);
}

export function getActiveNavigationItem(
  pathname: string
): SiteNavigationItem | undefined {
  return [...siteNavigationItems]
    .filter(item => isNavigationItemActive(pathname, item))
    .sort((left, right) => right.href.length - left.href.length)[0];
}
