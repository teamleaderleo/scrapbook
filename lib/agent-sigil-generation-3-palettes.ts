export const generation3PaletteModes = [
  'monotone',
  'duotone',
  'tri-colour',
  'material',
  'luminous',
] as const;

export type Generation3PaletteMode = (typeof generation3PaletteModes)[number];
export type Generation3PaletteSelectionMode = Generation3PaletteMode | 'auto';
export type Generation3PaletteRole = 'dominant' | 'support' | 'highlight' | 'neutral';

export type Generation3PaletteRoles = Record<Generation3PaletteRole, string>;

export type Generation3PaletteVariant = {
  id: string;
  label: string;
  light: Generation3PaletteRoles;
  dark: Generation3PaletteRoles;
  monochrome: Generation3PaletteRoles;
};

export type Generation3PaletteFamily = {
  id: string;
  label: string;
  mode: Generation3PaletteMode;
  variants: readonly Generation3PaletteVariant[];
};

export type Generation3PaletteRecipe = {
  version: 1;
  familyId: string;
  familyLabel: string;
  mode: Generation3PaletteMode;
  paletteVariant: number;
  variantIndex: number;
  variantId: string;
  variantLabel: string;
  fingerprint: string;
  light: Generation3PaletteRoles;
  dark: Generation3PaletteRoles;
  monochrome: Generation3PaletteRoles;
  identity: {
    scope: string;
    designation: string;
  };
};

export type Generation3PaletteInput = {
  /** Stable repository, product, or organisation identifier. */
  scope: string;
  /** Agent-chosen title or designation. */
  designation: string;
  /** Deliberate reproducible palette inside the stable family. */
  paletteVariant?: number;
  /** Limit deterministic family selection to one reviewed palette mode. */
  paletteMode?: Generation3PaletteSelectionMode;
};

const MAX_SCOPE_LENGTH = 192;
const MAX_DESIGNATION_LENGTH = 160;
const MAX_PALETTE_VARIANT = 9_999;

type RoleTuple = readonly [
  dominant: string,
  support: string,
  highlight: string,
  neutral: string,
];

type PaletteVariantDefinition = {
  id: string;
  label: string;
  light: RoleTuple;
  dark: RoleTuple;
  monochrome: RoleTuple;
};

type PaletteFamilyDefinition = {
  id: string;
  label: string;
  mode: Generation3PaletteMode;
  variants: readonly PaletteVariantDefinition[];
};

function roles([dominant, support, highlight, neutral]: RoleTuple): Generation3PaletteRoles {
  return { dominant, support, highlight, neutral };
}

const paletteFamilyDefinitions = [
  {
    id: 'indigo-frost',
    label: 'Indigo / frost',
    mode: 'monotone',
    variants: [
      {
        id: 'indigo-frost-clear',
        label: 'Clear indigo',
        light: ['#4f46a5', '#766fc2', '#b9b9e8', '#292744'],
        dark: ['#9189e8', '#6860bd', '#d8d7ff', '#222039'],
        monochrome: ['#555555', '#858585', '#c7c7c7', '#252525'],
      },
      {
        id: 'indigo-frost-muted',
        label: 'Muted indigo',
        light: ['#5b4f93', '#8279b1', '#c9c5e3', '#2c2940'],
        dark: ['#9f95d8', '#7168a8', '#e2ddf6', '#242138'],
        monochrome: ['#5d5d5d', '#8a8a8a', '#cccccc', '#272727'],
      },
    ],
  },
  {
    id: 'ceramic-slate',
    label: 'Ceramic / slate',
    mode: 'monotone',
    variants: [
      {
        id: 'ceramic-slate-stone',
        label: 'Stone ceramic',
        light: ['#65717a', '#8d989e', '#d7dcdd', '#30383d'],
        dark: ['#aab4b8', '#7b878c', '#eef1f1', '#252c30'],
        monochrome: ['#626262', '#949494', '#d1d1d1', '#292929'],
      },
      {
        id: 'ceramic-slate-blue',
        label: 'Blue ceramic',
        light: ['#536f7c', '#829eaa', '#cedde2', '#29373d'],
        dark: ['#8eabb5', '#65838f', '#dfedf0', '#222e33'],
        monochrome: ['#5f5f5f', '#909090', '#cecece', '#282828'],
      },
    ],
  },
  {
    id: 'ultramarine-silver',
    label: 'Ultramarine / silver',
    mode: 'duotone',
    variants: [
      {
        id: 'ultramarine-silver-cobalt',
        label: 'Cobalt silver',
        light: ['#345ec4', '#72a4d6', '#c8d8e5', '#283244'],
        dark: ['#6e91ea', '#77bad5', '#d9e7ef', '#20293b'],
        monochrome: ['#4f4f4f', '#8b8b8b', '#c9c9c9', '#242424'],
      },
      {
        id: 'ultramarine-silver-cyan',
        label: 'Cyan steel',
        light: ['#2f74a7', '#62a8c7', '#c4dce7', '#24343f'],
        dark: ['#62a6d2', '#6bc1d4', '#d7edf2', '#1f2c34'],
        monochrome: ['#545454', '#8d8d8d', '#cccccc', '#252525'],
      },
    ],
  },
  {
    id: 'moss-citron',
    label: 'Moss / citron',
    mode: 'duotone',
    variants: [
      {
        id: 'moss-citron-green',
        label: 'Moss green',
        light: ['#687536', '#a8af4d', '#d7dc84', '#303522'],
        dark: ['#9eab58', '#c3ca65', '#e4e8a3', '#292e20'],
        monochrome: ['#595959', '#8d8d8d', '#c8c8c8', '#282828'],
      },
      {
        id: 'moss-citron-olive',
        label: 'Olive citron',
        light: ['#73713a', '#b1a94b', '#ddd37c', '#343222'],
        dark: ['#aaa45a', '#ccc467', '#ece49a', '#2e2c20'],
        monochrome: ['#5c5c5c', '#909090', '#cccccc', '#292929'],
      },
    ],
  },
  {
    id: 'teal-pale-gold',
    label: 'Teal / mint / pale gold',
    mode: 'tri-colour',
    variants: [
      {
        id: 'teal-pale-gold-mint',
        label: 'Mint gold',
        light: ['#278d8b', '#75bba9', '#dfbe68', '#243c3b'],
        dark: ['#53b8b2', '#88cfba', '#efd485', '#203535'],
        monochrome: ['#555555', '#8f8f8f', '#cfcfcf', '#252525'],
      },
      {
        id: 'teal-pale-gold-brass',
        label: 'Sea green brass',
        light: ['#247d73', '#66ae91', '#d2ad61', '#243934'],
        dark: ['#4fa99a', '#7cc4a4', '#e5ca7b', '#20322e'],
        monochrome: ['#575757', '#8d8d8d', '#cbcbcb', '#272727'],
      },
    ],
  },
  {
    id: 'coral-warm-cream',
    label: 'Coral / rose / warm cream',
    mode: 'tri-colour',
    variants: [
      {
        id: 'coral-warm-cream-rose',
        label: 'Coral rose',
        light: ['#d25f5d', '#ad5d7e', '#ebcfa4', '#4b2c34'],
        dark: ['#e77f78', '#cf7a9c', '#f4ddb8', '#3d2730'],
        monochrome: ['#5b5b5b', '#8c8c8c', '#d0d0d0', '#292929'],
      },
      {
        id: 'coral-warm-cream-apricot',
        label: 'Rose apricot',
        light: ['#c65d72', '#a35a88', '#e9c28f', '#482d36'],
        dark: ['#dd7c8a', '#c0769c', '#f2d4aa', '#3a2930'],
        monochrome: ['#5d5d5d', '#8b8b8b', '#cecece', '#282828'],
      },
    ],
  },
  {
    id: 'cedar-amber-charcoal',
    label: 'Cedar / amber / charcoal',
    mode: 'material',
    variants: [
      {
        id: 'cedar-amber-charcoal-clear',
        label: 'Clear cedar',
        light: ['#875537', '#c38845', '#e2b96f', '#342c27'],
        dark: ['#b47a55', '#d2a05d', '#edcc8a', '#2d2724'],
        monochrome: ['#5c5c5c', '#919191', '#cccccc', '#292929'],
      },
      {
        id: 'cedar-amber-charcoal-walnut',
        label: 'Walnut ochre',
        light: ['#79533c', '#b27d45', '#d6ae6e', '#332b27'],
        dark: ['#a67758', '#c7965e', '#e6c487', '#2c2724'],
        monochrome: ['#5d5d5d', '#8f8f8f', '#cacaca', '#292929'],
      },
    ],
  },
  {
    id: 'clay-oxblood-sand',
    label: 'Clay / oxblood / sand',
    mode: 'material',
    variants: [
      {
        id: 'clay-oxblood-sand-earth',
        label: 'Earth clay',
        light: ['#a5604e', '#783b3f', '#d8b88c', '#402f2c'],
        dark: ['#c47d68', '#a7585d', '#e6caa3', '#372a28'],
        monochrome: ['#606060', '#858585', '#c9c9c9', '#292929'],
      },
      {
        id: 'clay-oxblood-sand-terracotta',
        label: 'Terracotta burgundy',
        light: ['#a95f45', '#7e3f4b', '#d9ae82', '#402d2b'],
        dark: ['#ca765d', '#a75464', '#e5c49b', '#372825'],
        monochrome: ['#606060', '#888888', '#c8c8c8', '#292929'],
      },
    ],
  },
  {
    id: 'graphite-electric-blue',
    label: 'Graphite / electric blue',
    mode: 'luminous',
    variants: [
      {
        id: 'graphite-electric-blue-cobalt',
        label: 'Electric cobalt',
        light: ['#3f4653', '#647184', '#347ee8', '#20252c'],
        dark: ['#7b879a', '#48566a', '#65a6ff', '#1d2229'],
        monochrome: ['#5b5b5b', '#858585', '#c7c7c7', '#242424'],
      },
      {
        id: 'graphite-electric-blue-cyan',
        label: 'Electric cyan',
        light: ['#414852', '#5e7485', '#2e9fd2', '#20262c'],
        dark: ['#798998', '#456376', '#57c0eb', '#1b2228'],
        monochrome: ['#5b5b5b', '#878787', '#c8c8c8', '#242424'],
      },
    ],
  },
  {
    id: 'graphite-violet-beacon',
    label: 'Graphite / violet beacon',
    mode: 'luminous',
    variants: [
      {
        id: 'graphite-violet-beacon-blue',
        label: 'Violet blue',
        light: ['#454451', '#6d6481', '#9b6de4', '#25232b'],
        dark: ['#858190', '#5e5573', '#bd8cff', '#211f27'],
        monochrome: ['#5d5d5d', '#898989', '#cbcbcb', '#252525'],
      },
      {
        id: 'graphite-violet-beacon-magenta',
        label: 'Violet magenta',
        light: ['#49444f', '#745f7d', '#b25ad7', '#27232a'],
        dark: ['#8c8190', '#684f70', '#d37af0', '#221e25'],
        monochrome: ['#5e5e5e', '#8a8a8a', '#cccccc', '#252525'],
      },
    ],
  },
] as const satisfies readonly PaletteFamilyDefinition[];

export const generation3PaletteCatalogue: readonly Generation3PaletteFamily[] =
  paletteFamilyDefinitions.map((family) => ({
    id: family.id,
    label: family.label,
    mode: family.mode,
    variants: family.variants.map((variant) => ({
      id: variant.id,
      label: variant.label,
      light: roles(variant.light),
      dark: roles(variant.dark),
      monochrome: roles(variant.monochrome),
    })),
  }));

function normaliseIdentityField(value: string, label: string, maximum: number) {
  const normalised = value.trim().replace(/\s+/g, ' ');
  if (!normalised) throw new Error(`Generation 3 palette ${label} must not be empty.`);
  if (normalised.length > maximum) {
    throw new Error(`Generation 3 palette ${label} must contain at most ${maximum} characters.`);
  }
  return normalised;
}

function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function fingerprint(value: string) {
  return hashString(value).toString(16).padStart(8, '0');
}

function normalisePaletteVariant(value: number | undefined) {
  const paletteVariant = value ?? 0;
  if (
    !Number.isFinite(paletteVariant) ||
    paletteVariant < 0 ||
    paletteVariant > MAX_PALETTE_VARIANT
  ) {
    throw new Error(
      `Generation 3 palette variant must be between 0 and ${MAX_PALETTE_VARIANT}.`,
    );
  }
  return Math.floor(paletteVariant);
}

function isGeneration3PaletteMode(value: string): value is Generation3PaletteMode {
  return generation3PaletteModes.includes(value as Generation3PaletteMode);
}

export function createGeneration3PaletteRecipe(
  input: Generation3PaletteInput,
): Generation3PaletteRecipe {
  const scope = normaliseIdentityField(input.scope, 'scope', MAX_SCOPE_LENGTH);
  const designation = normaliseIdentityField(
    input.designation,
    'designation',
    MAX_DESIGNATION_LENGTH,
  );
  const paletteVariant = normalisePaletteVariant(input.paletteVariant);
  const paletteMode = input.paletteMode ?? 'auto';
  if (paletteMode !== 'auto' && !isGeneration3PaletteMode(paletteMode)) {
    throw new Error(`Unsupported Generation 3 palette mode: ${paletteMode}`);
  }

  const candidates =
    paletteMode === 'auto'
      ? generation3PaletteCatalogue
      : generation3PaletteCatalogue.filter((family) => family.mode === paletteMode);
  const familySeed = `generation-3:palette-family:${paletteMode}:${scope}:${designation}`;
  const family = candidates[hashString(familySeed) % candidates.length]!;
  const variantIndex = paletteVariant % family.variants.length;
  const variant = family.variants[variantIndex]!;

  return {
    version: 1,
    familyId: family.id,
    familyLabel: family.label,
    mode: family.mode,
    paletteVariant,
    variantIndex,
    variantId: variant.id,
    variantLabel: variant.label,
    fingerprint: fingerprint(`${familySeed}:${variant.id}:${paletteVariant}`),
    light: { ...variant.light },
    dark: { ...variant.dark },
    monochrome: { ...variant.monochrome },
    identity: { scope, designation },
  };
}
