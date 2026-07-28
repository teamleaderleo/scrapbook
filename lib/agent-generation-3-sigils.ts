import {
  createAgentKumikoSigilRecipe,
  createDistinctAgentKumikoPopulation,
  type AgentKumikoSigilInput,
  type AgentKumikoSigilRecipe,
} from './agent-kumiko-sigils';
import {
  createGeneration3PaletteRecipe,
  type Generation3PaletteRecipe,
  type Generation3PaletteSelectionMode,
  type Generation3PaletteRoles,
} from './agent-sigil-generation-3-palettes';

export const AGENT_GENERATION_3_COMBINED_RENDERER_VERSION = 1 as const;

export type AgentGeneration3Surface = 'light' | 'dark' | 'monochrome';

export type AgentGeneration3SigilInput = Omit<AgentKumikoSigilInput, 'palette'> & {
  paletteMode?: Generation3PaletteSelectionMode;
  paletteVariant?: number;
};

export type AgentGeneration3SigilRecipe = {
  rendererVersion: typeof AGENT_GENERATION_3_COMBINED_RENDERER_VERSION;
  generation: 3;
  geometry: AgentKumikoSigilRecipe;
  palette: Generation3PaletteRecipe;
  accentStrutIndex: number;
  accentJointIndex: number;
  fingerprint: string;
  layerFingerprints: {
    geometry: string;
    accents: string;
    palette: string;
  };
};

export type GeneratedAgentGeneration3Sigil = {
  recipe: AgentGeneration3SigilRecipe;
  svg: string;
  dataUri: string;
  accessibleLabel: string;
};

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

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function geometryInput(input: AgentGeneration3SigilInput): AgentKumikoSigilInput {
  return {
    scope: input.scope,
    designation: input.designation,
    description: input.description,
    variant: input.variant,
    complexity: input.complexity ?? 'quiet',
    family: input.family,
    palette: 'mono',
  };
}

function baselineGeometryInput(input: AgentGeneration3SigilInput): AgentKumikoSigilInput {
  return {
    ...geometryInput(input),
    description: undefined,
  };
}

function locateAccentJoint(
  geometry: AgentKumikoSigilRecipe,
  baseline: AgentKumikoSigilRecipe,
) {
  if (!geometry.identity.description) return -1;
  return geometry.joints.findIndex((joint, index) => {
    const comparison = baseline.joints[index];
    return (
      comparison &&
      (comparison.radius !== joint.radius || comparison.opacity !== joint.opacity)
    );
  });
}

function createRecipeFromGeometry(
  input: AgentGeneration3SigilInput,
  geometry: AgentKumikoSigilRecipe,
): AgentGeneration3SigilRecipe {
  const baseline = createAgentKumikoSigilRecipe({
    ...baselineGeometryInput(input),
    variant: geometry.variant,
    family: geometry.family,
  });
  const palette = createGeneration3PaletteRecipe({
    scope: geometry.identity.scope,
    designation: geometry.identity.designation,
    paletteMode: input.paletteMode,
    paletteVariant: input.paletteVariant,
  });
  const accentStrutIndex = geometry.struts.findIndex((strut) => strut.role === 'accent');
  const accentJointIndex = locateAccentJoint(geometry, baseline);
  const combinedFingerprint = fingerprint(
    [
      'agent-generation-3',
      AGENT_GENERATION_3_COMBINED_RENDERER_VERSION,
      geometry.graphFingerprint,
      geometry.layerFingerprints.accents,
      palette.fingerprint,
    ].join(':'),
  );

  return {
    rendererVersion: AGENT_GENERATION_3_COMBINED_RENDERER_VERSION,
    generation: 3,
    geometry,
    palette,
    accentStrutIndex,
    accentJointIndex,
    fingerprint: combinedFingerprint,
    layerFingerprints: {
      geometry: geometry.graphFingerprint,
      accents: geometry.layerFingerprints.accents,
      palette: palette.fingerprint,
    },
  };
}

export function createAgentGeneration3SigilRecipe(
  input: AgentGeneration3SigilInput,
): AgentGeneration3SigilRecipe {
  return createRecipeFromGeometry(
    input,
    createAgentKumikoSigilRecipe(geometryInput(input)),
  );
}

export function createDistinctAgentGeneration3Population(
  inputs: readonly AgentGeneration3SigilInput[],
  options: { minimumOccupancyDistance?: number; maximumVariantAttempts?: number } = {},
) {
  const geometries = createDistinctAgentKumikoPopulation(
    inputs.map(geometryInput),
    options,
  );

  return geometries.map((geometry, index) =>
    createRecipeFromGeometry(
      {
        ...inputs[index]!,
        variant: geometry.variant,
        family: geometry.family,
      },
      geometry,
    ),
  );
}

function roleForStrut(
  recipe: AgentGeneration3SigilRecipe,
  index: number,
): keyof Generation3PaletteRoles {
  const strut = recipe.geometry.struts[index]!;
  if (index === recipe.accentStrutIndex || strut.role === 'accent') return 'highlight';
  return strut.role === 'primary' ? 'dominant' : 'support';
}

export function renderAgentGeneration3SigilSvg(
  recipe: AgentGeneration3SigilRecipe,
  options: {
    size?: number;
    surface?: AgentGeneration3Surface;
    compact?: boolean;
    label?: string;
  } = {},
) {
  const size = Math.max(1, Math.min(2048, Math.floor(options.size ?? 100)));
  const surface = options.surface ?? 'light';
  const compact = options.compact ?? size <= 24;
  const roles = recipe.palette[surface];
  const label =
    options.label ??
    `${recipe.geometry.identity.designation} Generation 3 ${recipe.geometry.family} sigil ${recipe.fingerprint}`;

  const struts = recipe.geometry.struts
    .map((strut, index) => {
      const role = roleForStrut(recipe, index);
      if (compact && role === 'highlight') return '';
      const from = recipe.geometry.nodes[strut.from]!;
      const to = recipe.geometry.nodes[strut.to]!;
      return `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="${roles[role]}" stroke-opacity="${strut.opacity}" stroke-width="${strut.width}" data-generation-3-role="${role}"/>`;
    })
    .join('');

  const joints = recipe.geometry.joints
    .map((joint, index) => {
      const accent = index === recipe.accentJointIndex;
      if (compact && accent) return '';
      const point = recipe.geometry.nodes[joint.node]!;
      const role = accent ? 'highlight' : 'support';
      return `<circle cx="${point.x}" cy="${point.y}" r="${joint.radius}" fill="${roles[role]}" fill-opacity="${joint.opacity}" stroke="${roles.neutral}" stroke-width="0.65" data-generation-3-role="${role}"/>`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100" role="img" aria-label="${escapeXml(label)}" fill="none" stroke-linecap="round" stroke-linejoin="round">${struts}${joints}</svg>`;
}

export function generateAgentGeneration3Sigil(
  input: AgentGeneration3SigilInput,
  options: {
    size?: number;
    surface?: AgentGeneration3Surface;
    compact?: boolean;
  } = {},
): GeneratedAgentGeneration3Sigil {
  const recipe = createAgentGeneration3SigilRecipe(input);
  const accessibleLabel = `${recipe.geometry.identity.designation} Generation 3 ${recipe.geometry.family} sigil ${recipe.fingerprint}`;
  const svg = renderAgentGeneration3SigilSvg(recipe, {
    ...options,
    label: accessibleLabel,
  });
  return {
    recipe,
    svg,
    dataUri: `data:image/svg+xml,${encodeURIComponent(svg)}`,
    accessibleLabel,
  };
}
