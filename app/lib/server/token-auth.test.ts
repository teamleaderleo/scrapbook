import { describe, expect, it } from 'vitest';

import { timingSafeTokenEqual } from './token-auth';

describe('timingSafeTokenEqual', () => {
  it('accepts only exact token matches', () => {
    expect(timingSafeTokenEqual('secret', 'secret')).toBe(true);
    expect(timingSafeTokenEqual('Secret', 'secret')).toBe(false);
    expect(timingSafeTokenEqual('secret ', 'secret')).toBe(false);
    expect(timingSafeTokenEqual('short', 'a-much-longer-secret')).toBe(false);
  });
});
