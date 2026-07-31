import { describe, expect, it } from 'vitest';
import {
  getActiveNavigationItem,
  isNavigationItemActive,
  primaryNavigationItems,
  siteNavigationItems,
} from './site-navigation';

describe('site navigation registry', () => {
  it('exposes the visible destinations and keeps retired writing surfaces hidden', () => {
    const hrefs = siteNavigationItems.map((item) => item.href);
    expect(hrefs).toEqual(
      expect.arrayContaining(['/', '/space', '/time', '/gallery', '/atelier', '/snow-globe']),
    );
    expect(hrefs).not.toContain('/blog');
    expect(hrefs).not.toContain('/journal');
  });

  it('keeps tools and labs reachable without promoting them into the primary row', () => {
    const primaryIds = primaryNavigationItems.map((item) => item.id);
    expect(primaryIds).toEqual(['home', 'space', 'gallery']);
    expect(primaryIds).not.toContain('proxy');
    expect(primaryIds).not.toContain('snow-globe');
    expect(primaryIds).not.toContain('activity-lab');
    expect(primaryIds).not.toContain('sigil-lab');
  });

  it('matches nested routes and trailing slashes', () => {
    const space = siteNavigationItems.find((item) => item.id === 'space');
    expect(space).toBeDefined();
    expect(isNavigationItemActive('/space/review', space!)).toBe(true);
    expect(isNavigationItemActive('/space/edit/example/', space!)).toBe(true);
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
    expect(getActiveNavigationItem('/gallery')?.id).toBe('gallery');
    expect(getActiveNavigationItem('/snow-globe')?.id).toBe('snow-globe');
    expect(getActiveNavigationItem('/blog/about')).toBeUndefined();
    expect(getActiveNavigationItem('/unknown')).toBeUndefined();
  });
});
