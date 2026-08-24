import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { WorkDeepDivePractice } from './work-deep-dive-practice';

describe('WorkDeepDivePractice', () => {
  it('renders a quiet project-rehearsal surface around the real work record', () => {
    const html = renderToStaticMarkup(
      createElement(WorkDeepDivePractice, {
        recordId: 'preflight',
        title: 'Preflight',
      })
    );

    expect(html).toContain('Interview rehearsal');
    expect(html).toContain('Project deep dive · Preflight');
    expect(html).toContain('Give the short version');
    expect(html).toContain('Decision');
    expect(html).toContain('Evidence');
    expect(html).toContain('Reversal');
    expect(html).toContain('Ownership');
    expect(html).toContain('Again');
    expect(html).toContain('Debrief note');
    expect(html).toContain('Notes stay on this device.');
    expect(html).not.toContain('STAR');
  });

  it('uses a supplied reversal as the source for the reversal prompt', () => {
    const html = renderToStaticMarkup(
      createElement(WorkDeepDivePractice, {
        recordId: 'preflight',
        title: 'Preflight',
        reversal: 'The first cache sat behind the real critical-path wait.',
      })
    );

    expect(html).toContain('The first cache sat behind the real critical-path wait.');
    expect(html).toContain('what evidence moved the repair boundary');
  });
});
