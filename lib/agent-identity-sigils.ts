import {
  AGENT_SIGIL_RENDERER_VERSION,
  createAgentSigilRecipe,
  renderAgentSigilSvg,
  type AgentSigilComplexity,
  type AgentSigilElement,
  type AgentSigilPaletteMode,
  type AgentSigilRecipe,
  type GeneratedAgentSigil,
} from './agent-sigils';

export const agentIdentitySigilGenerations = [1, 2] as const;
export type AgentIdentitySigilGeneration = (typeof agentIdentitySigilGenerations)[number];

export type AgentIdentitySigilSelection = {
  generation?: AgentIdentitySigilGeneration;
  variant?: number;
  palette?: AgentSigilPaletteMode;
  complexity?: AgentSigilComplexity;
};

export type AgentIdentitySigilInput = {
  /** Stable repository, product, or organisation identifier. Controls the frame and palette. */
  scope: string;
  /** Agent-chosen title or designation. Controls the primary glyph. */
  designation: string;
  /** Work note, assignment, or description. Controls small accents only. */
  description?: string;
  /** Persist this tuple to pin a chosen result. Generation 2 is the default for new identities. */
  selection?: AgentIdentitySigilSelection;
};

export type AgentIdentitySigilRecipe = AgentSigilRecipe & {
  generation: AgentIdentitySigilGeneration;
  variant: number;
  identity: {
    scope: string;
    designation: string;
    description: string;
  };
  layerFingerprints: {
    frame: string;
    glyph: string;
    accents: string;
  };
};

const MAX_SCOPE_LENGTH = 192;
const MAX_DESIGNATION_LENGTH = 160;
const MAX_DESCRIPTION_LENGTH = 512;

function normaliseIdentityField(value: string, label: string, maximum: number) {
  const normalised = value.trim().replace(/\s+/g, ' ');
  if (!normalised) throw new Error(`Agent identity ${label} must not be empty.`);
  if (normalised.length > maximum) {
    throw new Error(`Agent identity ${label} must contain at most ${maximum} characters.`);
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

function createRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function round(value: number, precision = 3) {
  const scale = 10 ** precision;
  return Math.round(value * scale) / scale;
}

function between(random: () => number, minimum: number, maximum: number) {
  return minimum + (maximum - minimum) * random();
}

function integer(random: () => number, minimum: number, maximum: number) {
  return Math.floor(between(random, minimum, maximum + 1));
}

function polar(radius: number, angleDegrees: number) {
  const angle = (angleDegrees * Math.PI) / 180;
  return {
    x: 50 + Math.cos(angle) * radius,
    y: 50 + Math.sin(angle) * radius,
  };
}

function framedElements(scope: string, variant: number): AgentSigilElement[] {
  const random = createRandom(hashString(`generation-2:frame:${variant}:${scope}`));
  const outerRadius = between(random, 39, 43);
  const nodeCount = integer(random, 3, 7);
  const rotation = between(random, 0, 360);
  const elements: AgentSigilElement[] = [
    {
      kind: 'circle',
      cx: 50,
      cy: 50,
      r: round(outerRadius),
      fillOpacity: 0,
      strokeTone: 'base',
      strokeOpacity: 0.74,
      strokeWidth: round(between(random, 2.4, 4.2)),
    },
  ];

  if (random() > 0.28) {
    elements.push({
      kind: 'circle',
      cx: 50,
      cy: 50,
      r: round(outerRadius - between(random, 6.5, 10.5)),
      fillOpacity: 0,
      strokeTone: 'highlight',
      strokeOpacity: 0.34,
      strokeWidth: round(between(random, 1.1, 2.1)),
    });
  }

  for (let index = 0; index < nodeCount; index += 1) {
    const angle = rotation + (360 / nodeCount) * index;
    const point = polar(outerRadius, angle);
    const size = between(random, 3.2, 5.7);
    if (random() > 0.42) {
      elements.push({
        kind: 'circle',
        cx: round(point.x),
        cy: round(point.y),
        r: round(size),
        fillTone: index % 2 === 0 ? 'base' : 'accent',
        fillOpacity: 0.88,
        strokeTone: 'highlight',
        strokeOpacity: 0.46,
        strokeWidth: 0.8,
      });
    } else {
      elements.push({
        kind: 'rect',
        x: round(point.x - size),
        y: round(point.y - size),
        width: round(size * 2),
        height: round(size * 2),
        rx: round(size * 0.62),
        fillTone: index % 2 === 0 ? 'base' : 'accent',
        fillOpacity: 0.86,
        strokeTone: 'highlight',
        strokeOpacity: 0.42,
        strokeWidth: 0.8,
        transform: `rotate(${round(angle + 45)} ${round(point.x)} ${round(point.y)})`,
      });
    }
  }

  return elements;
}

function scaledGlyphElements(elements: AgentSigilElement[], complexity: AgentSigilComplexity) {
  const scale = complexity === 'quiet' ? 0.66 : complexity === 'dense' ? 0.77 : 0.72;
  const maximum = complexity === 'dense' ? 38 : complexity === 'quiet' ? 24 : 32;
  const transform = `translate(50 50) scale(${scale}) translate(-50 -50)`;

  return elements.slice(0, maximum).map((element) => ({
    ...element,
    fillOpacity:
      element.fillOpacity === undefined ? undefined : round(Math.min(0.94, element.fillOpacity * 0.92)),
    transform: element.transform ? `${transform} ${element.transform}` : transform,
  }));
}

function accentElements(description: string, designation: string, variant: number): AgentSigilElement[] {
  const effectiveDescription = description || designation;
  const random = createRandom(
    hashString(`generation-2:accents:${variant}:${designation}:${effectiveDescription}`),
  );
  const count = integer(random, 2, 5);
  const rotation = between(random, 0, 360);
  const elements: AgentSigilElement[] = [];

  for (let index = 0; index < count; index += 1) {
    const angle = rotation + (360 / count) * index + between(random, -14, 14);
    const point = polar(between(random, 10, 25), angle);
    const size = between(random, 2.2, 4.9);
    const tone = index % 3 === 0 ? 'highlight' : index % 2 === 0 ? 'base' : 'accent';

    if (random() > 0.36) {
      elements.push({
        kind: 'circle',
        cx: round(point.x),
        cy: round(point.y),
        r: round(size),
        fillTone: tone,
        fillOpacity: round(between(random, 0.64, 0.92)),
        strokeTone: 'stroke',
        strokeOpacity: 0.26,
        strokeWidth: 0.6,
      });
    } else {
      elements.push({
        kind: 'rect',
        x: round(point.x - size * 1.4),
        y: round(point.y - size * 0.55),
        width: round(size * 2.8),
        height: round(size * 1.1),
        rx: round(size * 0.55),
        fillTone: tone,
        fillOpacity: round(between(random, 0.58, 0.84)),
        transform: `rotate(${round(angle)} ${round(point.x)} ${round(point.y)})`,
      });
    }
  }

  if (random() > 0.46) {
    elements.push({
      kind: 'circle',
      cx: 50,
      cy: 50,
      r: round(between(random, 2.5, 5.2)),
      fillTone: 'highlight',
      fillOpacity: 0.82,
      strokeTone: 'stroke',
      strokeOpacity: 0.34,
      strokeWidth: 0.7,
    });
  }

  return elements;
}

export function createAgentIdentitySigilRecipe(
  input: AgentIdentitySigilInput,
): AgentIdentitySigilRecipe {
  const scope = normaliseIdentityField(input.scope, 'scope', MAX_SCOPE_LENGTH);
  const designation = normaliseIdentityField(
    input.designation,
    'designation',
    MAX_DESIGNATION_LENGTH,
  );
  const description = input.description?.trim().replace(/\s+/g, ' ') ?? '';
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    throw new Error(
      `Agent identity description must contain at most ${MAX_DESCRIPTION_LENGTH} characters.`,
    );
  }

  const generation = input.selection?.generation ?? 2;
  if (!agentIdentitySigilGenerations.includes(generation)) {
    throw new Error(`Unsupported agent identity sigil generation: ${generation}`);
  }
  const variant = Math.max(0, Math.floor(input.selection?.variant ?? 0));
  const palette = input.selection?.palette ?? 'auto';
  const complexity = input.selection?.complexity ?? 'regular';

  if (generation === 1) {
    const legacy = createAgentSigilRecipe({
      seed: designation,
      version: AGENT_SIGIL_RENDERER_VERSION,
      nonce: variant,
      palette,
      complexity,
    });
    return {
      ...legacy,
      generation,
      variant,
      identity: { scope, designation, description },
      layerFingerprints: {
        frame: legacy.fingerprint,
        glyph: legacy.fingerprint,
        accents: legacy.fingerprint,
      },
    };
  }

  const frameFingerprint = fingerprint(`g2:frame:${variant}:${scope}`);
  const glyphFingerprint = fingerprint(`g2:glyph:${variant}:${designation}`);
  const accentFingerprint = fingerprint(
    `g2:accents:${variant}:${designation}:${description || designation}`,
  );
  const glyph = createAgentSigilRecipe({
    seed: `g2-glyph:${designation}`,
    nonce: variant,
    palette,
    complexity,
  });
  const paletteRecipe = createAgentSigilRecipe({
    seed: `g2-palette:${scope}:${designation}`.slice(0, 256),
    nonce: variant,
    palette,
    complexity: 'quiet',
  });
  const elements = [
    ...framedElements(scope, variant),
    ...scaledGlyphElements(glyph.elements, complexity),
    ...accentElements(description, designation, variant),
  ];
  const identityFingerprint = fingerprint(
    `g2:${variant}:${palette}:${complexity}:${scope}:${designation}:${description}`,
  );

  return {
    version: AGENT_SIGIL_RENDERER_VERSION,
    seed: designation,
    nonce: variant,
    fingerprint: identityFingerprint,
    family: glyph.family,
    paletteName: paletteRecipe.paletteName,
    palette: paletteRecipe.palette,
    complexity,
    symmetry: glyph.symmetry,
    rotation: glyph.rotation,
    elements,
    generation,
    variant,
    identity: { scope, designation, description },
    layerFingerprints: {
      frame: frameFingerprint,
      glyph: glyphFingerprint,
      accents: accentFingerprint,
    },
  };
}

export function renderAgentIdentitySigilSvg(
  recipe: AgentIdentitySigilRecipe,
  options: { size?: number; label?: string } = {},
) {
  return renderAgentSigilSvg(recipe, options);
}

export function generateAgentIdentitySigil(
  input: AgentIdentitySigilInput,
): GeneratedAgentSigil & { recipe: AgentIdentitySigilRecipe } {
  const recipe = createAgentIdentitySigilRecipe(input);
  const accessibleLabel = `${recipe.identity.designation} generation ${recipe.generation} agent identity sigil ${recipe.fingerprint}`;
  const svg = renderAgentIdentitySigilSvg(recipe, { label: accessibleLabel });
  return {
    recipe,
    svg,
    dataUri: `data:image/svg+xml,${encodeURIComponent(svg)}`,
    accessibleLabel,
  };
}
