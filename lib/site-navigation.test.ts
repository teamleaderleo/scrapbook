import { describe, expect, it } from 'vitest';
import {
  getActiveNavigationItem,
  isNavigationItemActive,
  primaryNavigationItems,
  siteNavigationItems,
} from './site-navigation';

describe('site navigation registry', () => {
  it('exposes every public sitemap destination', () => {
    const hrefs = siteNavigationItems.map((item) => item.href);
    expect(hrefs).toEqual(
      expect.arrayContaining(['/', '/space', '/time', '/blog', '/gallery', '/journal', '/atelier']),
    );
  });

  it('keeps tools and labs reachable without promoting them into the primary row', () => {
    const primaryIds = primaryNavigationItems.map((item) => item.id);
    expect(primaryIds).toEqual(['home', 'space', 'journal', 'gallery', 'blog']);
    expect(primaryIds).not.toContain('proxy');
    expect(primaryIds).not.toContain('activity-lab');
    expect(primaryIds).not.toContain('sigil-lab');
  });

  it('matches nested routes and trailing slashes', () => {
    const blog = siteNavigationItems.find((item) => item.id === 'blog');
    expect(blog).toBeDefined();
    expect(isNavigationItemActive('/blog/about', blog!)).toBe(true);
    expect(isNavigationItemActive('/blog/category/engineering/', blog!)).toBe(true);
  });

  it('keeps home exact and external links inactive', () => {
    const home = siteNavigationItems.find((item) => item.id === 'home');
    const github = siteNavigationItems.find((item) => item.id === 'github');
    expect(home).toBeDefined();
    expect(github).toBeDefined();
    expect(isNavigationItemActive('/', home!)).toBe(true);
    expect(isNavigationItemActive('/journal', home!)).toBe(false);
    expect(isNavigationItemActive('/github', github!)).toBe(false);
  });

  it('returns the active place for nested routes', () => {
    expect(getActiveNavigationItem('/space/review')?.id).toBe('space');
    expect(getActiveNavigationItem('/blog/about')?.id).toBe('blog');
    expect(getActiveNavigationItem('/unknown')).toBeUndefined();
  });
});
