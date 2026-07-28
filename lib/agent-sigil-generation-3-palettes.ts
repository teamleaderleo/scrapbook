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
  /** Canonical resolved index inside the selected reviewed family. */
  paletteVariant: number;
  variantIndex: number;
  variantId: string;
  variantLabel: string;
  fingerprint: string;
  light: Generation3PaletteRoles;
  dark: Generation3PaletteRoles;
  monochrome: Generation3PaletteRoles;
  identity: { scope: string; designation: string };
};

export type Generation3PaletteInput = {
  scope: string;
  designation: string;
  /** Deliberate reproducible choice. Values wrap onto the reviewed in-family catalogue. */
  paletteVariant?: number;
  paletteMode?: Generation3PaletteSelectionMode;
};

type RoleTuple = readonly [string, string, string, string];
type VariantDefinition = readonly [
  id: string,
  label: string,
  light: RoleTuple,
  dark: RoleTuple,
  monochrome: RoleTuple,
];
type FamilyDefinition = readonly [
  id: string,
  label: string,
  mode: Generation3PaletteMode,
  variants: readonly VariantDefinition[],
];

const MAX_SCOPE_LENGTH = 192;
const MAX_DESIGNATION_LENGTH = 160;
const MAX_PALETTE_VARIANT = 9_999;

function roles([dominant, support, highlight, neutral]: RoleTuple): Generation3PaletteRoles {
  return { dominant, support, highlight, neutral };
}

const definitions: readonly FamilyDefinition[] = [
  [
    'indigo-frost',
    'Indigo / frost',
    'monotone',
    [
      ['indigo-frost-clear', 'Clear indigo', ['#4f46a5', '#766fc2', '#b9b9e8', '#292744'], ['#9189e8', '#6860bd', '#d8d7ff', '#222039'], ['#555555', '#858585', '#c7c7c7', '#252525']],
      ['indigo-frost-muted', 'Muted indigo', ['#5b4f93', '#8279b1', '#c9c5e3', '#2c2940'], ['#9f95d8', '#7168a8', '#e2ddf6', '#242138'], ['#5d5d5d', '#8a8a8a', '#cccccc', '#272727']],
    ],
  ],
  [
    'ceramic-slate',
    'Ceramic / slate',
    'monotone',
    [
      ['ceramic-slate-stone', 'Stone ceramic', ['#65717a', '#8d989e', '#d7dcdd', '#30383d'], ['#aab4b8', '#7b878c', '#eef1f1', '#252c30'], ['#626262', '#949494', '#d1d1d1', '#292929']],
      ['ceramic-slate-blue', 'Blue ceramic', ['#536f7c', '#829eaa', '#cedde2', '#29373d'], ['#8eabb5', '#65838f', '#dfedf0', '#222e33'], ['#5f5f5f', '#909090', '#cecece', '#282828']],
    ],
  ],
  [
    'ultramarine-silver',
    'Ultramarine / silver',
    'duotone',
    [
      ['ultramarine-silver-cobalt', 'Cobalt silver', ['#345ec4', '#72a4d6', '#c8d8e5', '#283244'], ['#6e91ea', '#77bad5', '#d9e7ef', '#20293b'], ['#4f4f4f', '#8b8b8b', '#c9c9c9', '#242424']],
      ['ultramarine-silver-cyan', 'Cyan steel', ['#2f74a7', '#62a8c7', '#c4dce7', '#24343f'], ['#62a6d2', '#6bc1d4', '#d7edf2', '#1f2c34'], ['#545454', '#8d8d8d', '#cccccc', '#252525']],
    ],
  ],
  [
    'moss-citron',
    'Moss / citron',
    'duotone',
    [
      ['moss-citron-green', 'Moss green', ['#687536', '#a8af4d', '#d7dc84', '#303522'], ['#9eab58', '#c3ca65', '#e4e8a3', '#292e20'], ['#595959', '#8d8d8d', '#c8c8c8', '#282828']],
      ['moss-citron-olive', 'Olive citron', ['#73713a', '#b1a94b', '#ddd37c', '#343222'], ['#aaa45a', '#ccc467', '#ece49a', '#2e2c20'], ['#5c5c5c', '#909090', '#cccccc', '#292929']],
    ],
  ],
  [
    'teal-pale-gold',
    'Teal / mint / pale gold',
    'tri-colour',
    [
      ['teal-pale-gold-mint', 'Mint gold', ['#278d8b', '#75bba9', '#dfbe68', '#243c3b'], ['#53b8b2', '#88cfba', '#efd485', '#203535'], ['#555555', '#8f8f8f', '#cfcfcf', '#252525']],
      ['teal-pale-gold-brass', 'Sea green brass', ['#247d73', '#66ae91', '#d2ad61', '#243934'], ['#4fa99a', '#7cc4a4', '#e5ca7b', '#20322e'], ['#575757', '#8d8d8d', '#cbcbcb', '#272727']],
    ],
  ],
  [
    'coral-warm-cream',
    'Coral / rose / warm cream',
    'tri-colour',
    [
      ['coral-warm-cream-rose', 'Coral rose', ['#d25f5d', '#ad5d7e', '#ebcfa4', '#4b2c34'], ['#e77f78', '#cf7a9c', '#f4ddb8', '#3d2730'], ['#5b5b5b', '#8c8c8c', '#d0d0d0', '#292929']],
      ['coral-warm-cream-apricot', 'Rose apricot', ['#c65d72', '#a35a88', '#e9c28f', '#482d36'], ['#dd7c8a', '#c0769c', '#f2d4aa', '#3a2930'], ['#5d5d5d', '#8b8b8b', '#cecece', '#282828']],
    ],
  ],
  [
    'cedar-amber-charcoal',
    'Cedar / amber / charcoal',
    'material',
    [
      ['cedar-amber-charcoal-clear', 'Clear cedar', ['#875537', '#c38845', '#e2b96f', '#342c27'], ['#b47a55', '#d2a05d', '#edcc8a', '#2d2724'], ['#5c5c5c', '#919191', '#cccccc', '#292929']],
      ['cedar-amber-charcoal-walnut', 'Walnut ochre', ['#79533c', '#b27d45', '#d6ae6e', '#332b27'], ['#a67758', '#c7965e', '#e6c487', '#2c2724'], ['#5d5d5d', '#8f8f8f', '#cacaca', '#292929']],
    ],
  ],
  [
    'clay-oxblood-sand',
    'Clay / oxblood / sand',
    'material',
    [
      ['clay-oxblood-sand-earth', 'Earth clay', ['#a5604e', '#783b3f', '#d8b88c', '#402f2c'], ['#c47d68', '#a7585d', '#e6caa3', '#372a28'], ['#606060', '#858585', '#c9c9c9', '#292929']],
      ['clay-oxblood-sand-terracotta', 'Terracotta burgundy', ['#a95f45', '#7e3f4b', '#d9ae82', '#402d2b'], ['#ca765d', '#a75464', '#e5c49b', '#372825'], ['#606060', '#888888', '#c8c8c8', '#292929']],
    ],
  ],
  [
    'graphite-electric-blue',
    'Graphite / electric blue',
    'luminous',
    [
      ['graphite-electric-blue-cobalt', 'Electric cobalt', ['#3f4653', '#647184', '#347ee8', '#20252c'], ['#7b879a', '#48566a', '#65a6ff', '#1d2229'], ['#5b5b5b', '#858585', '#c7c7c7', '#242424']],
      ['graphite-electric-blue-cyan', 'Electric cyan', ['#414852', '#5e7485', '#2e9fd2', '#20262c'], ['#798998', '#456376', '#57c0eb', '#1b2228'], ['#5b5b5b', '#878787', '#c8c8c8', '#242424']],
    ],
  ],
  [
    'graphite-violet-beacon',
    'Graphite / violet beacon',
    'luminous',
    [
      ['graphite-violet-beacon-blue', 'Violet blue', ['#454451', '#6d6481', '#9b6de4', '#25232b'], ['#858190', '#5e5573', '#bd8cff', '#211f27'], ['#5d5d5d', '#898989', '#cbcbcb', '#252525']],
      ['graphite-violet-beacon-magenta', 'Violet magenta', ['#49444f', '#745f7d', '#b25ad7', '#27232a'], ['#8c8190', '#684f70', '#d37af0', '#221e25'], ['#5e5e5e', '#8a8a8a', '#cccccc', '#252525']],
    ],
  ],
];

export const generation3PaletteCatalogue: readonly Generation3PaletteFamily[] = definitions.map(
  ([id, label, mode, variants]) => ({
    id,
    label,
    mode,
    variants: variants.map(([variantId, variantLabel, light, dark, monochrome]) => ({
      id: variantId,
      label: variantLabel,
      light: roles(light),
      dark: roles(dark),
      monochrome: roles(monochrome),
    })),
  }),
);

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

function normaliseRequestedVariant(value: number | undefined) {
  const requested = value ?? 0;
  if (!Number.isFinite(requested) || requested < 0 || requested > MAX_PALETTE_VARIANT) {
    throw new Error(`Generation 3 palette variant must be between 0 and ${MAX_PALETTE_VARIANT}.`);
  }
  return Math.floor(requested);
}

function isGeneration3PaletteMode(value: string): value is Generation3PaletteMode {
  return generation3PaletteModes.includes(value as Generation3PaletteMode);
}

export function createGeneration3PaletteRecipe(
  input: Generation3PaletteInput,
): Generation3PaletteRecipe {
  const scope = normaliseIdentityField(input.scope, 'scope', MAX_SCOPE_LENGTH);
  const designation = normaliseIdentityField(input.designation, 'designation', MAX_DESIGNATION_LENGTH);
  const requestedVariant = normaliseRequestedVariant(input.paletteVariant);
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
  const variantIndex = requestedVariant % family.variants.length;
  const variant = family.variants[variantIndex]!;

  return {
    version: 1,
    familyId: family.id,
    familyLabel: family.label,
    mode: family.mode,
    paletteVariant: variantIndex,
    variantIndex,
    variantId: variant.id,
    variantLabel: variant.label,
    fingerprint: fingerprint(`${familySeed}:${variant.id}`),
    light: { ...variant.light },
    dark: { ...variant.dark },
    monochrome: { ...variant.monochrome },
    identity: { scope, designation },
  };
}
