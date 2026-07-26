import { describe, expect, it } from 'vitest';

import {
  agentVisitCreativePrinciples,
  agentVisitInspirationModes,
  agentVisitPersonalityPresets,
  agentVisitRemixKinds,
  agentVisitStylePresets,
} from './agent-guestbook-creative';

function idsAreUnique(options: readonly { id: string }[]) {
  const ids = options.map((option) => option.id);
  return new Set(ids).size === ids.length;
}

describe('agent guestbook creative options', () => {
  it('keeps every option catalogue unique', () => {
    expect(idsAreUnique(agentVisitInspirationModes)).toBe(true);
    expect(idsAreUnique(agentVisitStylePresets)).toBe(true);
    expect(idsAreUnique(agentVisitPersonalityPresets)).toBe(true);
    expect(idsAreUnique(agentVisitRemixKinds)).toBe(true);
  });

  it('keeps prior entries opt-in while allowing new styles', () => {
    expect(agentVisitCreativePrinciples.priorEntriesAreOptIn).toBe(true);
    expect(agentVisitCreativePrinciples.customStylesAreAllowed).toBe(true);
    expect(agentVisitStylePresets.some((style) => style.id === 'custom')).toBe(true);
    expect(agentVisitInspirationModes.map((mode) => mode.id)).toEqual([
      'blind',
      'browse',
      'thread',
      'remix',
    ]);
  });
});
