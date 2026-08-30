import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { MachineHealthAccess } from './machine-health-access';

describe('MachineHealthAccess', () => {
  it('makes the existing Google and GitHub identities the primary path', () => {
    const html = renderToStaticMarkup(
      createElement(MachineHealthAccess, {
        hasOwnerSignIn: true,
        hasRecoveryToken: false,
      })
    );

    expect(html).toContain('Continue with Google');
    expect(html).toContain('Continue with GitHub');
    expect(html).not.toContain('Use recovery token');
  });

  it('keeps token access as a secondary recovery path', () => {
    const html = renderToStaticMarkup(
      createElement(MachineHealthAccess, {
        hasOwnerSignIn: true,
        hasRecoveryToken: true,
      })
    );

    expect(html).toContain('Use recovery token');
    expect(html).toContain('action="/machine-health/access/token"');
  });

  it('supports recovery-only environments without broken OAuth controls', () => {
    const html = renderToStaticMarkup(
      createElement(MachineHealthAccess, {
        hasOwnerSignIn: false,
        hasRecoveryToken: true,
      })
    );

    expect(html).not.toContain('Continue with Google');
    expect(html).not.toContain('Continue with GitHub');
    expect(html).toMatch(/<details[^>]*open=""/);
  });
});
