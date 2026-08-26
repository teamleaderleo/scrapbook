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
        '/operator',
        '/space',
        '/knowledge',
        '/work',
        '/time',
        '/gallery',
        '/desk',
        '/atelier',
        '/snow-globe',
        'https://github.com/teamleaderleo/preflight',
        'https://github.com/teamleaderleo/stensibly',
        'https://github.com/teamleaderleo/smolrunner',
        'https://github.com/teamleaderleo/cultist',
      ])
    );
    expect(hrefs).not.toContain('/blog');
    expect(hrefs).toContain('/journal');
    expect(hrefs).not.toContain('/resume');
    expect(hrefs).not.toContain('https://github.com/teamleaderleo/fieldwork');
    expect(hrefs).not.toContain(
      'https://github.com/teamleaderleo/linux-fieldwork'
    );

    expect(
      siteNavigationItems.find(item => item.id === 'glaeda-repository')
    ).toMatchObject({
      href: 'https://github.com/teamleaderleo/smolrunner',
      label: 'Glaeda',
      description: 'Trust-tiered Linux execution for coding agents.',
    });
    expect(
      siteNavigationItems.find(item => item.id === 'smolrunner-repository')
    ).toBeUndefined();
  });

  it('keeps Operator, Knowledge, tools, the evidence journal, and labs out of the primary row', () => {
    const primaryIds = primaryNavigationItems.map(item => item.id);
    expect(primaryIds).toEqual(['home', 'space', 'work', 'gallery', 'desk']);
    expect(primaryIds).not.toContain('operator');
    expect(primaryIds).not.toContain('knowledge');
    expect(primaryIds).not.toContain('journal');
    expect(primaryIds).not.toContain('proxy');
    expect(primaryIds).not.toContain('snow-globe');
    expect(primaryIds).not.toContain('activity-lab');
    expect(primaryIds).not.toContain('sigil-lab');
  });

  it('keeps room audience and publishing intent explicit', () => {
    expect(siteNavigationItems.find(item => item.id === 'home')?.surface).toBe(
      'public'
    );
    expect(
      siteNavigationItems.find(item => item.id === 'operator')?.surface
    ).toBe('public');
    expect(siteNavigationItems.find(item => item.id === 'space')?.surface).toBe(
      'public'
    );
    expect(
      siteNavigationItems.find(item => item.id === 'knowledge')?.surface
    ).toBe('public');
    expect(siteNavigationItems.find(item => item.id === 'work')?.surface).toBe(
      'public'
    );
    expect(siteNavigationItems.find(item => item.id === 'desk')?.surface).toBe(
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
      'operator',
      'space',
      'knowledge',
      'work',
      'gallery',
      'desk',
      'journal',
      'time',
    ]);
    expect(nonPublicNavigationItems.map(item => item.id)).toEqual(['proxy']);
    expect(homeRoomNavigationItems.map(item => item.id)).toEqual([
      'space',
      'knowledge',
      'work',
      'gallery',
      'desk',
      'atelier',
      'snow-globe',
    ]);
  });

  it('matches nested routes and trailing slashes', () => {
    const operator = siteNavigationItems.find(item => item.id === 'operator');
    const space = siteNavigationItems.find(item => item.id === 'space');
    const knowledge = siteNavigationItems.find(item => item.id === 'knowledge');
    const desk = siteNavigationItems.find(item => item.id === 'desk');
    expect(operator).toBeDefined();
    expect(space).toBeDefined();
    expect(knowledge).toBeDefined();
    expect(desk).toBeDefined();
    expect(isNavigationItemActive('/operator/', operator!)).toBe(true);
    expect(isNavigationItemActive('/space/review', space!)).toBe(true);
    expect(isNavigationItemActive('/space/edit/example/', space!)).toBe(true);
    expect(
      isNavigationItemActive('/knowledge/storage/mvcc/', knowledge!)
    ).toBe(true);
    expect(isNavigationItemActive('/desk/example/', desk!)).toBe(true);
  });

  it('keeps home exact and external links inactive', () => {
    const home = siteNavigationItems.find(item => item.id === 'home');
    const github = siteNavigationItems.find(item => item.id === 'github');
    expect(home).toBeDefined();
    expect(github).toBeDefined();
    expect(isNavigationItemActive('/', home!)).toBe(true);
    expect(isNavigationItemActive('/desk', home!)).toBe(false);
    expect(isNavigationItemActive('/github', github!)).toBe(false);
  });

  it('returns the active place for registered routes', () => {
    expect(getActiveNavigationItem('/operator')?.id).toBe('operator');
    expect(getActiveNavigationItem('/space/review')?.id).toBe('space');
    expect(getActiveNavigationItem('/knowledge')?.id).toBe('knowledge');
    expect(getActiveNavigationItem('/knowledge/storage/mvcc')?.id).toBe(
      'knowledge'
    );
    expect(getActiveNavigationItem('/work')?.id).toBe('work');
    expect(getActiveNavigationItem('/gallery')?.id).toBe('gallery');
    expect(getActiveNavigationItem('/desk')?.id).toBe('desk');
    expect(getActiveNavigationItem('/desk/example')?.id).toBe('desk');
    expect(getActiveNavigationItem('/journal')?.id).toBe('journal');
    expect(getActiveNavigationItem('/snow-globe')?.id).toBe('snow-globe');
    expect(getActiveNavigationItem('/resume')).toBeUndefined();
    expect(getActiveNavigationItem('/blog/about')).toBeUndefined();
    expect(getActiveNavigationItem('/unknown')).toBeUndefined();
  });
});
