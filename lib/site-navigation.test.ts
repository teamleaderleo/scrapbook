import { describe, expect, it } from 'vitest';
import {
  getActiveNavigationItem,
  homeRoomNavigationItems,
  indexedNavigationItems,
  isNavigationItemActive,
  nonPublicNavigationItems,
  primaryNavigationItems,
  siteNavigationItems,
} from './site-navigation';

describe('site navigation registry', () => {
  it('exposes the visible destinations and keeps retired surfaces hidden', () => {
    const hrefs = siteNavigationItems.map(item => item.href);
    expect(hrefs).toEqual(
      expect.arrayContaining([
        '/',
        '/space',
        '/time',
        '/gallery',
        '/atelier',
        '/snow-globe',
      ])
    );
    expect(hrefs).not.toContain('/blog');
    expect(hrefs).toContain('/journal');
    expect(hrefs).not.toContain('/resume');
  });

  it('keeps tools, secondary places, and labs out of the primary row', () => {
    const primaryIds = primaryNavigationItems.map(item => item.id);
    expect(primaryIds).toEqual(['home', 'space', 'gallery', 'journal']);
    expect(primaryIds).not.toContain('proxy');
    expect(primaryIds).not.toContain('snow-globe');
    expect(primaryIds).not.toContain('activity-lab');
    expect(primaryIds).not.toContain('sigil-lab');
  });

  it('keeps room audience and publishing intent explicit', () => {
    expect(siteNavigationItems.find(item => item.id === 'home')?.surface).toBe(
      'public'
    );
    expect(siteNavigationItems.find(item => item.id === 'space')?.surface).toBe(
      'public'
    );
    expect(
      siteNavigationItems.find(item => item.id === 'atelier')?.surface
    ).toBe('experimental');
    expect(siteNavigationItems.find(item => item.id === 'proxy')?.surface).toBe(
      'operational'
    );
    expect(
      siteNavigationItems.find(item => item.id === 'github')?.surface
    ).toBe('external');

    expect(indexedNavigationItems.map(item => item.id)).toEqual([
      'home',
      'space',
      'gallery',
      'journal',
      'time',
    ]);
    expect(nonPublicNavigationItems.map(item => item.id)).toEqual(['proxy']);
    expect(homeRoomNavigationItems.map(item => item.id)).toEqual([
      'space',
      'gallery',
      'journal',
      'atelier',
      'snow-globe',
    ]);
  });

  it('matches nested routes and trailing slashes', () => {
    const space = siteNavigationItems.find(item => item.id === 'space');
    expect(space).toBeDefined();
    expect(isNavigationItemActive('/space/review', space!)).toBe(true);
    expect(isNavigationItemActive('/space/edit/example/', space!)).toBe(true);
  });

  it('keeps home exact and external links inactive', () => {
    const home = siteNavigationItems.find(item => item.id === 'home');
    const github = siteNavigationItems.find(item => item.id === 'github');
    expect(home).toBeDefined();
    expect(github).toBeDefined();
    expect(isNavigationItemActive('/', home!)).toBe(true);
    expect(isNavigationItemActive('/journal', home!)).toBe(false);
    expect(isNavigationItemActive('/github', github!)).toBe(false);
  });

  it('returns the active place for registered routes', () => {
    expect(getActiveNavigationItem('/space/review')?.id).toBe('space');
    expect(getActiveNavigationItem('/gallery')?.id).toBe('gallery');
    expect(getActiveNavigationItem('/journal')?.id).toBe('journal');
    expect(getActiveNavigationItem('/snow-globe')?.id).toBe('snow-globe');
    expect(getActiveNavigationItem('/resume')).toBeUndefined();
    expect(getActiveNavigationItem('/blog/about')).toBeUndefined();
    expect(getActiveNavigationItem('/unknown')).toBeUndefined();
  });
});
