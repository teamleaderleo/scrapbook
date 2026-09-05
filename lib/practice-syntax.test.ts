import { beforeAll, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { getPracticeAppearance } from './practice-syntax';
import { blend, type PracticeAppearanceData } from './practice-appearance';

let appearance: PracticeAppearanceData;
beforeAll(async () => { appearance = await getPracticeAppearance(); });

function contrast(a: string, b: string) {
  const luminance = (hex: string) => [1, 3, 5].map(start => parseInt(hex.slice(start, start + 2), 16) / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

describe('practice syntax preparation', () => {
  it('preserves every source character and supplies all theme colors', () => {
    for (const [text, tokens] of Object.entries(appearance.syntax)) {
      let end = 0;
      for (const token of tokens) {
        expect(token.start).toBe(end);
        expect(token.end).toBeGreaterThan(token.start);
        expect(token.colors).toHaveLength(appearance.themes.length);
        for (const color of token.colors) expect(color).toMatch(/^#[\da-f]{6}([\da-f]{2})?$/i);
        end = token.end;
      }
      expect(end).toBe(text.length);
    }
  });
  it('uses a readable foreground and muted UI text in every palette', () => {
    for (const theme of appearance.themes) {
      expect(contrast(theme.foreground, theme.background), theme.id).toBeGreaterThanOrEqual(4.5);
      expect(contrast(blend(theme.foreground, theme.background, 0.85), theme.background), theme.id).toBeGreaterThanOrEqual(4.5);
      expect(contrast(theme.accent, theme.background), `${theme.id} controls`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(theme.error, theme.background), `${theme.id} errors`).toBeGreaterThanOrEqual(4.5);
    }
  });
});
