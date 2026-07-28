import type {
  Generation3PaletteRole,
  Generation3PaletteRoles,
  Generation3PaletteVariant,
} from './agent-sigil-generation-3-palettes';

export const GENERATION_3_MIN_ROLE_CONTRAST = 1.5;

const chromaticRoles: Exclude<Generation3PaletteRole, 'neutral'>[] = [
  'dominant',
  'support',
  'highlight',
];
const surfaces: Array<'light' | 'dark' | 'monochrome'> = [
  'light',
  'dark',
  'monochrome',
];
const hexColour = /^#[0-9a-f]{6}$/i;

function channelToLinear(value: number) {
  const channel = value / 255;
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(colour: string) {
  if (!hexColour.test(colour)) throw new Error(`Invalid Generation 3 palette colour: ${colour}`);
  const red = Number.parseInt(colour.slice(1, 3), 16);
  const green = Number.parseInt(colour.slice(3, 5), 16);
  const blue = Number.parseInt(colour.slice(5, 7), 16);

  return (
    0.2126 * channelToLinear(red) +
    0.7152 * channelToLinear(green) +
    0.0722 * channelToLinear(blue)
  );
}

export function generation3PaletteContrastRatio(first: string, second: string) {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

export type Generation3PaletteContrastFailure = {
  paletteId: string;
  surface: 'light' | 'dark' | 'monochrome';
  role: Exclude<Generation3PaletteRole, 'neutral'>;
  ratio: number;
  minimum: number;
};

function surfaceFailures(
  paletteId: string,
  surface: Generation3PaletteContrastFailure['surface'],
  roles: Generation3PaletteRoles,
  minimum: number,
) {
  return chromaticRoles.flatMap((role): Generation3PaletteContrastFailure[] => {
    const ratio = generation3PaletteContrastRatio(roles[role], roles.neutral);
    return ratio + Number.EPSILON < minimum
      ? [{ paletteId, surface, role, ratio, minimum }]
      : [];
  });
}

export function generation3PaletteContrastFailures(
  palette: Generation3PaletteVariant,
  minimum = GENERATION_3_MIN_ROLE_CONTRAST,
) {
  if (!Number.isFinite(minimum) || minimum < 1) {
    throw new Error('Generation 3 palette contrast minimum must be a finite ratio of at least 1.');
  }

  return surfaces.flatMap((surface) =>
    surfaceFailures(palette.id, surface, palette[surface], minimum),
  );
}

export function assertGeneration3PaletteContrast(
  palette: Generation3PaletteVariant,
  minimum = GENERATION_3_MIN_ROLE_CONTRAST,
) {
  const failures = generation3PaletteContrastFailures(palette, minimum);
  if (failures.length === 0) return;

  const details = failures
    .map(
      (failure) =>
        `${failure.surface}.${failure.role} ${failure.ratio.toFixed(2)}:1 < ${failure.minimum.toFixed(2)}:1`,
    )
    .join(', ');
  throw new Error(`Generation 3 palette ${palette.id} fails the contrast floor: ${details}`);
}
