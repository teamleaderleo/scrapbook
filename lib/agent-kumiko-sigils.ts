import {
  createAgentSigilRecipe,
  type AgentSigilComplexity,
  type AgentSigilPalette,
  type AgentSigilPaletteMode,
  type AgentSigilTone,
} from './agent-sigils';

export const AGENT_KUMIKO_SIGIL_RENDERER_VERSION = 1 as const;
export const AGENT_KUMIKO_SIGIL_GENERATION = 3 as const;

export const agentKumikoFamilies = [
  'triangular-brace',
  'hex-cell',
  'diamond-weave',
  'square-sash',
  'nested-joint',
  'broken-lattice',
  'star-joint',
  'rosette-lattice',
] as const;

export type AgentKumikoFamily = (typeof agentKumikoFamilies)[number];
export type AgentKumikoStrutRole = 'primary' | 'secondary' | 'accent';

export type AgentKumikoPoint = {
  x: number;
  y: number;
};

export type AgentKumikoStrut = {
  from: number;
  to: number;
  role: AgentKumikoStrutRole;
  tone: AgentSigilTone;
  opacity: number;
  width: number;
};

export type AgentKumikoJoint = {
  node: number;
  tone: AgentSigilTone;
  opacity: number;
  radius: number;
};

export type AgentKumikoSigilInput = {
  /** Stable repository, project, or organisation identifier. Controls the lattice family and proportion. */
  scope: string;
  /** Agent title or designation. Controls the joint cadence and internal infill. */
  designation: string;
  /** Work note. Selects at most one accent without changing the lattice geometry or palette. */
  description?: string;
  /** Reproducible candidate inside this experimental lineage. */
  variant?: number;
  palette?: AgentSigilPaletteMode;
  /** Quiet is the default for this experiment. */
  complexity?: AgentSigilComplexity;
  /** Explicit lab-only family override. Normal generation lets scope select the family. */
  family?: AgentKumikoFamily;
};

export type AgentKumikoSigilRecipe = {
  rendererVersion: typeof AGENT_KUMIKO_SIGIL_RENDERER_VERSION;
  generation: typeof AGENT_KUMIKO_SIGIL_GENERATION;
  variant: number;
  family: AgentKumikoFamily;
  identity: {
    scope: string;
    designation: string;
    description: string;
  };
  complexity: AgentSigilComplexity;
  paletteName: string;
  palette: AgentSigilPalette;
  rotation: number;
  reflected: boolean;
  nodes: AgentKumikoPoint[];
  struts: AgentKumikoStrut[];
  joints: AgentKumikoJoint[];
  protectedVoids: number;
  fingerprint: string;
  graphFingerprint: string;
  occupancyDescriptor: string;
  layerFingerprints: {
    lattice: string;
    infill: string;
    accents: string;
    palette: string;
  };
};

export type GeneratedAgentKumikoSigil = {
  recipe: AgentKumikoSigilRecipe;
  svg: string;
  dataUri: string;
  accessibleLabel: string;
};

type RawStrut = {
  from: number;
  to: number;
  role: Exclude<AgentKumikoStrutRole, 'accent'>;
};

type RawGraph = {
  nodes: AgentKumikoPoint[];
  struts: RawStrut[];
  protectedVoids: number;
};

const MAX_SCOPE_LENGTH = 192;
const MAX_DESIGNATION_LENGTH = 160;
const MAX_DESCRIPTION_LENGTH = 512;
const OCCUPANCY_GRID_SIZE = 12;

function normaliseRequired(value: string, label: string, maximum: number) {
  const normalised = value.trim().replace(/\s+/g, ' ');
  if (!normalised) throw new Error(`Agent Kumiko sigil ${label} must not be empty.`);
  if (normalised.length > maximum) {
    throw new Error(`Agent Kumiko sigil ${label} must contain at most ${maximum} characters.`);
  }
  return normalised;
}

function normaliseDescription(value: string | undefined) {
  const normalised = value?.trim().replace(/\s+/g, ' ') ?? '';
  if (normalised.length > MAX_DESCRIPTION_LENGTH) {
    throw new Error(
      `Agent Kumiko sigil description must contain at most ${MAX_DESCRIPTION_LENGTH} characters.`,
    );
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

function between(random: () => number, minimum: number, maximum: number) {
  return minimum + (maximum - minimum) * random();
}

function integer(random: () => number, minimum: number, maximum: number) {
  return Math.floor(between(random, minimum, maximum + 1));
}

function choose<T>(random: () => number, values: readonly T[]) {
  return values[Math.min(values.length - 1, Math.floor(random() * values.length))]!;
}

function round(value: number, precision = 3) {
  const scale = 10 ** precision;
  return Math.round(value * scale) / scale;
}

function polar(radius: number, angleDegrees: number): AgentKumikoPoint {
  const angle = (angleDegrees * Math.PI) / 180;
  return {
    x: round(50 + Math.cos(angle) * radius),
    y: round(50 + Math.sin(angle) * radius),
  };
}

function edge(
  from: number,
  to: number,
  role: Exclude<AgentKumikoStrutRole, 'accent'> = 'primary',
): RawStrut {
  return { from, to, role };
}

function triangularBraceGraph(random: () => number): RawGraph {
  const shoulder = between(random, 31, 36);
  const nodes = [
    { x: 50, y: 12 },
    { x: 17, y: 80 },
    { x: 83, y: 80 },
    { x: 50, y: 54 },
    { x: shoulder, y: 43 },
    { x: 100 - shoulder, y: 43 },
  ];
  return {
    nodes,
    struts: [
      edge(0, 4),
      edge(0, 5),
      edge(4, 1),
      edge(5, 2),
      edge(4, 3),
      edge(5, 3),
      edge(3, 1, 'secondary'),
      edge(3, 2, 'secondary'),
      edge(1, 2, 'secondary'),
    ],
    protectedVoids: 3,
  };
}

function hexCellGraph(random: () => number): RawGraph {
  const rotation = choose(random, [0, 30] as const);
  const outer = Array.from({ length: 6 }, (_, index) => polar(35, rotation + index * 60));
  const inner = Array.from({ length: 3 }, (_, index) => polar(14, rotation + 30 + index * 120));
  const nodes = [...outer, ...inner, { x: 50, y: 50 }];
  return {
    nodes,
    struts: [
      edge(0, 1),
      edge(1, 2),
      edge(2, 3),
      edge(3, 4),
      edge(4, 5),
      edge(0, 6, 'secondary'),
      edge(2, 7, 'secondary'),
      edge(4, 8, 'secondary'),
      edge(6, 7),
      edge(7, 8),
      edge(8, 6),
      edge(6, 9, 'secondary'),
      edge(7, 9, 'secondary'),
      edge(8, 9, 'secondary'),
    ],
    protectedVoids: 4,
  };
}

function diamondWeaveGraph(random: () => number): RawGraph {
  const spread = between(random, 25, 31);
  const nodes = [
    { x: 50, y: 10 },
    { x: 50 - spread, y: 31 },
    { x: 50 + spread, y: 31 },
    { x: 50, y: 50 },
    { x: 50 - spread, y: 69 },
    { x: 50 + spread, y: 69 },
    { x: 50, y: 90 },
    { x: 30, y: 50 },
    { x: 70, y: 50 },
  ];
  return {
    nodes,
    struts: [
      edge(0, 1),
      edge(0, 2),
      edge(1, 3),
      edge(2, 3),
      edge(3, 4),
      edge(3, 5),
      edge(4, 6),
      edge(5, 6),
      edge(1, 7, 'secondary'),
      edge(7, 4, 'secondary'),
      edge(2, 8, 'secondary'),
      edge(8, 5, 'secondary'),
      edge(7, 3, 'secondary'),
      edge(3, 8, 'secondary'),
    ],
    protectedVoids: 4,
  };
}

function squareSashGraph(random: () => number): RawGraph {
  const inset = between(random, 16, 21);
  const far = 100 - inset;
  const nodes = [
    { x: inset, y: inset },
    { x: 50, y: inset },
    { x: far, y: inset },
    { x: far, y: 50 },
    { x: far, y: far },
    { x: 50, y: far },
    { x: inset, y: far },
    { x: inset, y: 50 },
    { x: 50, y: 50 },
    { x: 35, y: 35 },
    { x: 65, y: 35 },
    { x: 65, y: 65 },
    { x: 35, y: 65 },
  ];
  return {
    nodes,
    struts: [
      edge(0, 1),
      edge(1, 2),
      edge(2, 3),
      edge(3, 4),
      edge(4, 5),
      edge(5, 6),
      edge(7, 0),
      edge(9, 10),
      edge(10, 11),
      edge(11, 12),
      edge(12, 9),
      edge(1, 8, 'secondary'),
      edge(3, 8, 'secondary'),
      edge(5, 8, 'secondary'),
      edge(7, 8, 'secondary'),
    ],
    protectedVoids: 5,
  };
}

function nestedJointGraph(random: () => number): RawGraph {
  const outerRadius = between(random, 36, 40);
  const innerRadius = between(random, 15, 19);
  const outer = Array.from({ length: 4 }, (_, index) => polar(outerRadius, -90 + index * 90));
  const inner = Array.from({ length: 4 }, (_, index) => polar(innerRadius, -45 + index * 90));
  return {
    nodes: [...outer, ...inner],
    struts: [
      edge(0, 1),
      edge(1, 2),
      edge(2, 3),
      edge(4, 5),
      edge(5, 6),
      edge(6, 7),
      edge(7, 4),
      edge(0, 4, 'secondary'),
      edge(1, 5, 'secondary'),
      edge(2, 6, 'secondary'),
      edge(3, 7, 'secondary'),
      edge(4, 6, 'secondary'),
      edge(5, 7, 'secondary'),
    ],
    protectedVoids: 5,
  };
}

function brokenLatticeGraph(random: () => number): RawGraph {
  const coordinates = [19, 50, 81];
  const nodes = coordinates.flatMap((y) => coordinates.map((x) => ({ x, y })));
  const candidates = [
    edge(0, 1),
    edge(1, 2),
    edge(3, 4),
    edge(4, 5),
    edge(6, 7),
    edge(7, 8),
    edge(0, 3),
    edge(3, 6),
    edge(1, 4),
    edge(4, 7),
    edge(2, 5),
    edge(5, 8),
    edge(0, 4, 'secondary'),
    edge(2, 4, 'secondary'),
    edge(4, 6, 'secondary'),
    edge(4, 8, 'secondary'),
  ];
  const required = new Set([1, 2, 6, 9, 10]);
  const struts = candidates.filter((_, index) => required.has(index) || random() > 0.48);
  return {
    nodes,
    struts,
    protectedVoids: Math.max(2, 8 - Math.floor(struts.length / 2)),
  };
}

function starJointGraph(random: () => number): RawGraph {
  const rotation = choose(random, [0, 22.5] as const);
  const outer = Array.from({ length: 8 }, (_, index) => polar(37, rotation + index * 45));
  const inner = Array.from({ length: 4 }, (_, index) => polar(15, rotation + index * 90));
  const nodes = [{ x: 50, y: 50 }, ...outer, ...inner];
  return {
    nodes,
    struts: [
      edge(0, 9),
      edge(0, 10),
      edge(0, 11),
      edge(0, 12),
      edge(9, 1),
      edge(9, 2, 'secondary'),
      edge(10, 3),
      edge(10, 4, 'secondary'),
      edge(11, 5),
      edge(11, 6, 'secondary'),
      edge(12, 7),
      edge(12, 8, 'secondary'),
      edge(1, 2, 'secondary'),
      edge(3, 4, 'secondary'),
      edge(5, 6, 'secondary'),
      edge(7, 8, 'secondary'),
    ],
    protectedVoids: 6,
  };
}

function rosetteLatticeGraph(random: () => number): RawGraph {
  const count = choose(random, [6, 8] as const);
  const rotation = count === 6 ? 0 : 22.5;
  const inner = Array.from({ length: count }, (_, index) =>
    polar(between(random, 20, 23), rotation + index * (360 / count)),
  );
  const outer = Array.from({ length: count }, (_, index) =>
    polar(between(random, 35, 39), rotation + index * (360 / count)),
  );
  const nodes = [{ x: 50, y: 50 }, ...inner, ...outer];
  const struts: RawStrut[] = [];
  for (let index = 0; index < count; index += 1) {
    const innerIndex = 1 + index;
    const nextInnerIndex = 1 + ((index + 1) % count);
    const outerIndex = 1 + count + index;
    struts.push(edge(innerIndex, nextInnerIndex));
    if (index % 2 === 0) struts.push(edge(0, innerIndex, 'secondary'));
    struts.push(edge(innerIndex, outerIndex, index % 2 === 0 ? 'primary' : 'secondary'));
    if (index % 3 !== 1) {
      struts.push(edge(outerIndex, 1 + count + ((index + 1) % count), 'secondary'));
    }
  }
  return {
    nodes,
    struts,
    protectedVoids: count,
  };
}

function graphFor(family: AgentKumikoFamily, random: () => number) {
  if (family === 'triangular-brace') return triangularBraceGraph(random);
  if (family === 'hex-cell') return hexCellGraph(random);
  if (family === 'diamond-weave') return diamondWeaveGraph(random);
  if (family === 'square-sash') return squareSashGraph(random);
  if (family === 'nested-joint') return nestedJointGraph(random);
  if (family === 'broken-lattice') return brokenLatticeGraph(random);
  if (family === 'star-joint') return starJointGraph(random);
  return rosetteLatticeGraph(random);
}

function transformPoint(
  point: AgentKumikoPoint,
  rotation: number,
  reflected: boolean,
  scaleX: number,
  scaleY: number,
): AgentKumikoPoint {
  const sourceX = reflected ? 100 - point.x : point.x;
  const scaledX = 50 + (sourceX - 50) * scaleX;
  const scaledY = 50 + (point.y - 50) * scaleY;
  const angle = (rotation * Math.PI) / 180;
  const x = scaledX - 50;
  const y = scaledY - 50;
  return {
    x: round(50 + x * Math.cos(angle) - y * Math.sin(angle)),
    y: round(50 + x * Math.sin(angle) + y * Math.cos(angle)),
  };
}

function graphString(nodes: AgentKumikoPoint[], struts: RawStrut[]) {
  const nodeString = nodes.map((node) => `${round(node.x, 1)},${round(node.y, 1)}`).join(';');
  const edgeString = struts
    .map((strut) => {
      const start = Math.min(strut.from, strut.to);
      const end = Math.max(strut.from, strut.to);
      return `${start}-${end}-${strut.role}`;
    })
    .sort()
    .join(';');
  return `${nodeString}|${edgeString}`;
}

function occupancyDescriptor(nodes: AgentKumikoPoint[], struts: RawStrut[]) {
  const cells = Array.from({ length: OCCUPANCY_GRID_SIZE * OCCUPANCY_GRID_SIZE }, () => false);
  for (const strut of struts) {
    const from = nodes[strut.from];
    const to = nodes[strut.to];
    if (!from || !to) continue;
    for (let step = 0; step <= 32; step += 1) {
      const progress = step / 32;
      const x = from.x + (to.x - from.x) * progress;
      const y = from.y + (to.y - from.y) * progress;
      const column = Math.max(
        0,
        Math.min(OCCUPANCY_GRID_SIZE - 1, Math.floor((x / 100) * OCCUPANCY_GRID_SIZE)),
      );
      const row = Math.max(
        0,
        Math.min(OCCUPANCY_GRID_SIZE - 1, Math.floor((y / 100) * OCCUPANCY_GRID_SIZE)),
      );
      cells[row * OCCUPANCY_GRID_SIZE + column] = true;
    }
  }
  return cells.map((value) => (value ? '1' : '0')).join('');
}

export function agentKumikoOccupancyDistance(left: string, right: string) {
  const length = Math.max(left.length, right.length);
  let distance = 0;
  for (let index = 0; index < length; index += 1) {
    if (left[index] !== right[index]) distance += 1;
  }
  return distance;
}

function strutWidth(role: RawStrut['role'], complexity: AgentSigilComplexity) {
  if (role === 'primary') return complexity === 'dense' ? 4.1 : 4.5;
  return complexity === 'quiet' ? 2.25 : complexity === 'dense' ? 2.75 : 2.5;
}

function includedStruts(
  struts: RawStrut[],
  complexity: AgentSigilComplexity,
  random: () => number,
): RawStrut[] {
  const primary = struts.filter((strut) => strut.role === 'primary');
  const secondary = struts.filter((strut) => strut.role === 'secondary');
  if (complexity === 'quiet') {
    const allowance = Math.max(1, Math.min(3, Math.floor(primary.length / 4)));
    return [
      ...primary,
      ...secondary
        .map((strut) => ({ strut, order: random() }))
        .sort((left, right) => left.order - right.order)
        .slice(0, allowance)
        .map(({ strut }) => strut),
    ];
  }
  if (complexity === 'regular') {
    return [
      ...primary,
      ...secondary.filter(() => random() > 0.36),
    ];
  }
  return [...primary, ...secondary];
}

function visibleJoints(nodes: AgentKumikoPoint[], struts: RawStrut[]): AgentKumikoJoint[] {
  const degree = Array.from({ length: nodes.length }, () => 0);
  for (const strut of struts) {
    degree[strut.from] = (degree[strut.from] ?? 0) + 1;
    degree[strut.to] = (degree[strut.to] ?? 0) + 1;
  }
  return degree.flatMap((value, node) =>
    value >= 3
      ? [
          {
            node,
            tone: 'highlight' as const,
            opacity: value >= 5 ? 0.84 : 0.64,
            radius: value >= 5 ? 2.25 : 1.65,
          },
        ]
      : [],
  );
}

export function createAgentKumikoSigilRecipe(
  input: AgentKumikoSigilInput,
): AgentKumikoSigilRecipe {
  const scope = normaliseRequired(input.scope, 'scope', MAX_SCOPE_LENGTH);
  const designation = normaliseRequired(
    input.designation,
    'designation',
    MAX_DESIGNATION_LENGTH,
  );
  const description = normaliseDescription(input.description);
  const variant = Math.max(0, Math.floor(input.variant ?? 0));
  const complexity = input.complexity ?? 'quiet';
  const paletteMode = input.palette ?? 'auto';

  const scopeRandom = createRandom(hashString(`g3-kumiko:scope:${variant}:${scope}`));
  const designationRandom = createRandom(
    hashString(`g3-kumiko:designation:${variant}:${designation}`),
  );
  const family =
    input.family ??
    agentKumikoFamilies[hashString(`g3-kumiko:family:${scope}`) % agentKumikoFamilies.length]!;
  const rotationStep = family === 'square-sash' || family === 'broken-lattice' ? 45 : 30;
  const rotation = integer(scopeRandom, 0, Math.floor(360 / rotationStep) - 1) * rotationStep;
  const reflected = scopeRandom() > 0.5;
  const scaleX = between(scopeRandom, 0.9, 1.05);
  const scaleY = between(scopeRandom, 0.9, 1.05);

  const rawGraph = graphFor(family, designationRandom);
  const nodes = rawGraph.nodes.map((point) =>
    transformPoint(point, rotation, reflected, scaleX, scaleY),
  );
  const selectedStruts = includedStruts(rawGraph.struts, complexity, designationRandom);
  const descriptionHash = description
    ? hashString(`g3-kumiko:accent:${variant}:${description}`)
    : null;
  const accentIndex =
    descriptionHash === null || selectedStruts.length === 0
      ? -1
      : descriptionHash % selectedStruts.length;
  const struts: AgentKumikoStrut[] = selectedStruts.map((strut, index) => {
    const accent = index === accentIndex;
    return {
      ...strut,
      role: accent ? 'accent' : strut.role,
      tone: accent ? 'highlight' : strut.role === 'primary' ? 'base' : 'accent',
      opacity: accent ? 0.96 : strut.role === 'primary' ? 0.92 : 0.7,
      width: accent
        ? round(strutWidth(strut.role, complexity) + 0.5)
        : strutWidth(strut.role, complexity),
    };
  });
  const joints = visibleJoints(nodes, selectedStruts);
  if (descriptionHash !== null && joints.length > 0) {
    const joint = joints[descriptionHash % joints.length]!;
    joint.tone = 'highlight';
    joint.opacity = 0.96;
    joint.radius = round(joint.radius + 0.35);
  }

  const paletteRecipe = createAgentSigilRecipe({
    seed: `g3-kumiko-palette:${scope}:${designation}`.slice(0, 256),
    nonce: variant,
    palette: paletteMode,
    complexity: 'quiet',
  });
  const canonicalGraph = graphString(nodes, selectedStruts);
  const graphFingerprint = fingerprint(`g3-kumiko:graph:${family}:${canonicalGraph}`);
  const occupancy = occupancyDescriptor(nodes, selectedStruts);
  const latticeFingerprint = fingerprint(
    `g3-kumiko:lattice:${family}:${variant}:${scope}:${rotation}:${reflected}:${round(scaleX)}:${round(scaleY)}`,
  );
  const infillFingerprint = fingerprint(
    `g3-kumiko:infill:${family}:${variant}:${designation}:${canonicalGraph}`,
  );
  const accentFingerprint = fingerprint(
    `g3-kumiko:accent:${variant}:${description || 'none'}`,
  );
  const paletteFingerprint = fingerprint(
    `g3-kumiko:palette:${variant}:${paletteMode}:${scope}:${designation}:${paletteRecipe.paletteName}`,
  );
  const identityFingerprint = fingerprint(
    `g3-kumiko:${variant}:${family}:${complexity}:${paletteMode}:${scope}:${designation}:${description}:${graphFingerprint}`,
  );

  return {
    rendererVersion: AGENT_KUMIKO_SIGIL_RENDERER_VERSION,
    generation: AGENT_KUMIKO_SIGIL_GENERATION,
    variant,
    family,
    identity: { scope, designation, description },
    complexity,
    paletteName: paletteRecipe.paletteName,
    palette: paletteRecipe.palette,
    rotation,
    reflected,
    nodes,
    struts,
    joints,
    protectedVoids: rawGraph.protectedVoids,
    fingerprint: identityFingerprint,
    graphFingerprint,
    occupancyDescriptor: occupancy,
    layerFingerprints: {
      lattice: latticeFingerprint,
      infill: infillFingerprint,
      accents: accentFingerprint,
      palette: paletteFingerprint,
    },
  };
}

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function toneColor(
  recipe: AgentKumikoSigilRecipe,
  tone: AgentSigilTone,
  monochrome: boolean,
) {
  return monochrome ? 'currentColor' : recipe.palette[tone];
}

export function renderAgentKumikoSigilSvg(
  recipe: AgentKumikoSigilRecipe,
  options: {
    size?: number;
    label?: string;
    monochrome?: boolean;
    debug?: boolean;
  } = {},
) {
  const size = Math.max(1, Math.min(2048, Math.floor(options.size ?? 100)));
  const monochrome = options.monochrome ?? false;
  const label =
    options.label ??
    `${recipe.identity.designation} experimental Kumiko-informed generation ${recipe.generation} sigil ${recipe.fingerprint}`;
  const struts = recipe.struts
    .map((strut) => {
      const from = recipe.nodes[strut.from]!;
      const to = recipe.nodes[strut.to]!;
      return `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="${toneColor(recipe, strut.tone, monochrome)}" stroke-opacity="${strut.opacity}" stroke-width="${strut.width}"/>`;
    })
    .join('');
  const joints = recipe.joints
    .map((joint) => {
      const point = recipe.nodes[joint.node]!;
      return `<circle cx="${point.x}" cy="${point.y}" r="${joint.radius}" fill="${toneColor(recipe, joint.tone, monochrome)}" fill-opacity="${joint.opacity}"/>`;
    })
    .join('');
  const debug = options.debug
    ? recipe.nodes
        .map(
          (point, index) =>
            `<g><circle cx="${point.x}" cy="${point.y}" r="1.15" fill="none" stroke="currentColor" stroke-opacity=".45" stroke-width=".55"/><text x="${point.x + 1.8}" y="${point.y - 1.8}" fill="currentColor" fill-opacity=".55" font-size="3">${index}</text></g>`,
        )
        .join('')
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100" role="img" aria-label="${escapeXml(label)}" fill="none" stroke-linecap="round" stroke-linejoin="round">${struts}${joints}${debug}</svg>`;
}

export function generateAgentKumikoSigil(
  input: AgentKumikoSigilInput,
): GeneratedAgentKumikoSigil {
  const recipe = createAgentKumikoSigilRecipe(input);
  const accessibleLabel = `${recipe.identity.designation} experimental Kumiko-informed generation ${recipe.generation} sigil ${recipe.fingerprint}`;
  const svg = renderAgentKumikoSigilSvg(recipe, { label: accessibleLabel });
  return {
    recipe,
    svg,
    dataUri: `data:image/svg+xml,${encodeURIComponent(svg)}`,
    accessibleLabel,
  };
}

export function createDistinctAgentKumikoPopulation(
  inputs: readonly AgentKumikoSigilInput[],
  options: { minimumOccupancyDistance?: number; maximumVariantAttempts?: number } = {},
) {
  const minimumDistance = Math.max(0, options.minimumOccupancyDistance ?? 8);
  const maximumAttempts = Math.max(1, options.maximumVariantAttempts ?? 48);
  const recipes: AgentKumikoSigilRecipe[] = [];

  return inputs.map((input) => {
    const initialVariant = Math.max(0, Math.floor(input.variant ?? 0));
    let candidate = createAgentKumikoSigilRecipe(input);
    for (let attempt = 0; attempt < maximumAttempts; attempt += 1) {
      const variant = initialVariant + attempt;
      const next = createAgentKumikoSigilRecipe({ ...input, variant });
      const graphIsUnique = recipes.every(
        (recipe) => recipe.graphFingerprint !== next.graphFingerprint,
      );
      const occupancyIsDistinct = recipes.every(
        (recipe) =>
          agentKumikoOccupancyDistance(
            recipe.occupancyDescriptor,
            next.occupancyDescriptor,
          ) >= minimumDistance,
      );
      candidate = next;
      if (graphIsUnique && occupancyIsDistinct) break;
    }
    recipes.push(candidate);
    return candidate;
  });
}
