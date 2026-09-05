import { describe, expect, it } from 'vitest';
import { botDeskEntries } from '@/lib/bot-desk';
import sitemap from './sitemap';

describe('sitemap', () => {
  it('publishes stable public rooms and Workbench articles while leaving private, experimental, and operational rooms out', () => {
    const urls = sitemap().map(entry => entry.url);
    const workbenchUrls = botDeskEntries.map(
      entry => `https://teamleaderleo.com/desk/${entry.slug}`
    );

    expect(urls).toEqual([
      'https://teamleaderleo.com/',
      'https://teamleaderleo.com/operator',
      'https://teamleaderleo.com/space',
      'https://teamleaderleo.com/knowledge',
      'https://teamleaderleo.com/work',
      'https://teamleaderleo.com/gallery',
      'https://teamleaderleo.com/desk',
      'https://teamleaderleo.com/journal',
      'https://teamleaderleo.com/time',
      'https://teamleaderleo.com/practice',
      'https://teamleaderleo.com/space/records',
      'https://teamleaderleo.com/space/records/stateful-regex-api-boundaries',
      'https://teamleaderleo.com/space/records/interviewing-with-ai-as-a-review-loop',
      'https://teamleaderleo.com/space/records/dense-mobile-reading-without-scroll-traps',
      'https://teamleaderleo.com/space/records/learning-from-disagreement',
      'https://teamleaderleo.com/space/records/vmm-shutdown-is-an-event-not-an-absence',
      'https://teamleaderleo.com/space/records/credential-caches-need-authority-boundaries',
      'https://teamleaderleo.com/space/records/evaluation-structures-shape-the-work',
      'https://teamleaderleo.com/space/records/typing-code-as-scales',
      'https://teamleaderleo.com/space/records/learning-trails-with-bounded-exploration',
      'https://teamleaderleo.com/space/records/performance-profiling-that-can-say-no',
      ...workbenchUrls,
    ]);
    expect(urls).not.toContain('https://teamleaderleo.com/atelier');
    expect(urls).not.toContain('https://teamleaderleo.com/proxy-dashboard');
  });
});
