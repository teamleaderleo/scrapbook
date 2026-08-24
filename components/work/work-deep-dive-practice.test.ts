import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  buildWorkDeepDivePrompt,
  WorkDeepDivePractice,
} from './work-deep-dive-practice';

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
    expect(
      buildWorkDeepDivePrompt(
        'reversal',
        'The first cache sat behind the real critical-path wait.'
      ).prompt
    ).toBe(
      'Use the real reversal in the record as your starting point: The first cache sat behind the real critical-path wait. Then explain what evidence moved the repair boundary and what you learned.'
    );
  });

  it('keeps a generic reversal question for records without one', () => {
    expect(buildWorkDeepDivePrompt('reversal').prompt).toContain(
      'plausible approach'
    );
  });
});
