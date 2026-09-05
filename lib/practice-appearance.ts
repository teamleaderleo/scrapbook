export const practiceThemeChoices = [
  { id: 'catppuccin-mocha', name: 'Catppuccin Mocha', type: 'dark' },
  { id: 'vesper', name: 'Vesper', type: 'dark' },
  { id: 'rose-pine', name: 'Rosé Pine', type: 'dark' },
  { id: 'rose-pine-moon', name: 'Rosé Pine Moon', type: 'dark' },
  { id: 'catppuccin-macchiato', name: 'Catppuccin Macchiato', type: 'dark' },
  { id: 'catppuccin-latte', name: 'Catppuccin Latte', type: 'light' },
  { id: 'rose-pine-dawn', name: 'Rosé Pine Dawn', type: 'light' },
] as const;

export type PracticeTheme = {
  id: string;
  name: string;
  type: 'light' | 'dark';
  background: string;
  foreground: string;
  accent: string;
  error: string;
};
export type PracticeToken = { start: number; end: number; colors: string[] };
export type PracticeAppearanceData = {
  themes: PracticeTheme[];
  syntax: Record<string, PracticeToken[]>;
};
export const practiceThemePreview = 'const read = () => "value";';

export function normalizeColor(hex: string) {
  return hex.length === 4 || hex.length === 5
    ? `#${hex.slice(1).split('').map(character => character + character).join('')}`
    : hex;
}
function rgb(value: string) {
  const hex = normalizeColor(value);
  return [1, 3, 5].map(start => parseInt(hex.slice(start, start + 2), 16));
}
export function blend(foreground: string, background: string, amount: number) {
  const fg = rgb(foreground);
  const bg = rgb(background);
  return `#${fg.map((v, i) => Math.round(v * amount + bg[i] * (1 - amount)).toString(16).padStart(2, '0')).join('')}`;
}
export function contrastRatio(a: string, b: string) {
  const luminance = (hex: string) => rgb(hex).map(v => v / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
export function readableColor(color: string, background: string, foreground: string) {
  for (let step = 0; step <= 10; step += 1) {
    const candidate = blend(foreground, color, step / 10);
    if (contrastRatio(candidate, background) >= 4.5) return candidate;
  }
  return foreground;
}
export function colorHsl(hex: string) {
  const [r, g, b] = rgb(hex).map(value => value / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const light = (max + min) / 2, delta = max - min;
  const saturation = delta ? delta / (1 - Math.abs(2 * light - 1)) : 0;
  const hue = !delta ? 0 : max === r ? ((g - b) / delta + 6) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  return `${hue * 60} ${saturation * 100}% ${light * 100}%`;
}
export function practiceThemeStyles(theme: PracticeTheme): Record<string, string> {
  return {
    '--background': colorHsl(theme.background),
    '--foreground': colorHsl(theme.foreground),
    '--muted-foreground': colorHsl(blend(theme.foreground, theme.background, 0.85)),
    '--border': colorHsl(blend(theme.foreground, theme.background, 0.23)),
    '--ring': colorHsl(theme.accent),
    '--practice-leaf': theme.accent,
    '--practice-rust': theme.error,
    colorScheme: theme.type,
  };
}
