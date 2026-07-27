export const AGENT_SIGIL_RENDERER_VERSION = 1 as const;

export const agentSigilFamilies = ['rosette', 'orbit', 'weave', 'tiles', 'bloom'] as const;
export type AgentSigilFamily = (typeof agentSigilFamilies)[number];

export type AgentSigilPaletteMode = 'auto' | 'warm' | 'cool' | 'mono';
export type AgentSigilComplexity = 'quiet' | 'regular' | 'dense';
export type AgentSigilTone = 'base' | 'accent' | 'highlight' | 'shadow' | 'stroke';

export type AgentSigilPalette = {
  name: string;
  group: Exclude<AgentSigilPaletteMode, 'auto'>;
  base: string;
  accent: string;
  highlight: string;
  shadow: string;
  stroke: string;
};

type AgentSigilElementBase = {
  fillTone?: AgentSigilTone;
  fillOpacity?: number;
  strokeTone?: AgentSigilTone;
  strokeOpacity?: number;
  strokeWidth?: number;
  transform?: string;
};

export type AgentSigilElement =
  | (AgentSigilElementBase & {
      kind: 'circle';
      cx: number;
      cy: number;
      r: number;
    })
  | (AgentSigilElementBase & {
      kind: 'ellipse';
      cx: number;
      cy: number;
      rx: number;
      ry: number;
    })
  | (AgentSigilElementBase & {
      kind: 'rect';
      x: number;
      y: number;
      width: number;
      height: number;
      rx: number;
    });

export type AgentSigilRecipe = {
  version: typeof AGENT_SIGIL_RENDERER_VERSION;
  seed: string;
  nonce: number;
  fingerprint: string;
  family: AgentSigilFamily;
  paletteName: string;
  palette: AgentSigilPalette;
  complexity: AgentSigilComplexity;
  symmetry: number;
  rotation: number;
  elements: AgentSigilElement[];
};

export type GenerateAgentSigilOptions = {
  seed: string;
  version?: typeof AGENT_SIGIL_RENDERER_VERSION;
  nonce?: number;
  palette?: AgentSigilPaletteMode;
  complexity?: AgentSigilComplexity;
};

export type GeneratedAgentSigil = {
  recipe: AgentSigilRecipe;
  svg: string;
  dataUri: string;
  accessibleLabel: string;
};

const palettes = [
  {
    name: 'coral-loop',
    group: 'warm',
    base: '#f06c67',
    accent: '#d74955',
    highlight: '#ffb0a5',
    shadow: '#8c2f3b',
    stroke: '#67242f',
  },
  {
    name: 'amber-tile',
    group: 'warm',
    base: '#eea24a',
    accent: '#d57a2b',
    highlight: '#ffd38c',
    shadow: '#8e4a1d',
    stroke: '#693619',
  },
  {
    name: 'sunflower',
    group: 'warm',
    base: '#d8b61e',
    accent: '#9d7e0e',
    highlight: '#f8df55',
    shadow: '#65500b',
    stroke: '#4f4009',
  },
  {
    name: 'violet-orbit',
    group: 'cool',
    base: '#9a73bd',
    accent: '#70519a',
    highlight: '#c8a7df',
    shadow: '#4a3266',
    stroke: '#37264d',
  },
  {
    name: 'electric-blue',
    group: 'cool',
    base: '#5a91ef',
    accent: '#3764c4',
    highlight: '#91bcff',
    shadow: '#243e84',
    stroke: '#1b2f68',
  },
  {
    name: 'mint-ring',
    group: 'cool',
    base: '#69d4b4',
    accent: '#36a98a',
    highlight: '#a8f0d8',
    shadow: '#236e5c',
    stroke: '#194f43',
  },
  {
    name: 'teal-cross',
    group: 'cool',
    base: '#43afba',
    accent: '#287c8c',
    highlight: '#8bdde3',
    shadow: '#1c5762',
    stroke: '#143f48',
  },
  {
    name: 'rose-fold',
    group: 'warm',
    base: '#d965a5',
    accent: '#a33b79',
    highlight: '#f2a5ce',
    shadow: '#6c2853',
    stroke: '#4f1d3d',
  },
  {
    name: 'graphite',
    group: 'mono',
    base: '#9297a1',
    accent: '#676d79',
    highlight: '#c9cdd4',
    shadow: '#3e434d',
    stroke: '#2c3038',
  },
] as const satisfies readonly AgentSigilPalette[];

function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
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

function randomBetween(random: () => number, minimum: number, maximum: number) {
  return minimum + (maximum - minimum) * random();
}

function randomInteger(random: () => number, minimum: number, maximum: number) {
  return Math.floor(randomBetween(random, minimum, maximum + 1));
}

function choose<T>(random: () => number, values: readonly T[]): T {
  return values[Math.min(values.length - 1, Math.floor(random() * values.length))]!;
}

function paletteFor(random: () => number, mode: AgentSigilPaletteMode): AgentSigilPalette {
  const candidates = mode === 'auto' ? palettes : palettes.filter((palette) => palette.group === mode);
  return { ...choose(random, candidates) };
}

function translatedTransform(transform: string | undefined, x: number, y: number) {
  return `translate(${round(x)} ${round(y)})${transform ? ` ${transform}` : ''}`;
}

function shadowed(
  element: AgentSigilElement,
  fillTone: AgentSigilTone,
  options: { opacity?: number; shadow?: boolean; stroke?: boolean } = {},
): AgentSigilElement[] {
  const result: AgentSigilElement[] = [];
  if (options.shadow !== false) {
    result.push({
      ...element,
      fillTone: 'shadow',
      fillOpacity: 0.34,
      strokeTone: 'stroke',
      strokeOpacity: 0.24,
      strokeWidth: 0.7,
      transform: translatedTransform(element.transform, 1.35, 1.65),
    });
  }
  result.push({
    ...element,
    fillTone,
    fillOpacity: options.opacity ?? 0.9,
    strokeTone: options.stroke === false ? undefined : 'highlight',
    strokeOpacity: options.stroke === false ? undefined : 0.58,
    strokeWidth: options.stroke === false ? undefined : 0.7,
  });
  return result;
}

function polar(radius: number, angleDegrees: number) {
  const angle = (angleDegrees * Math.PI) / 180;
  return {
    x: 50 + Math.cos(angle) * radius,
    y: 50 + Math.sin(angle) * radius,
  };
}

function rosetteElements(
  random: () => number,
  symmetry: number,
  rotation: number,
  complexity: AgentSigilComplexity,
): AgentSigilElement[] {
  const elements: AgentSigilElement[] = [];
  const orbit = randomBetween(random, 17, 22);
  const petalWidth = randomBetween(random, 7.5, 11.5);
  const petalHeight = randomBetween(random, 19, 25);

  for (let index = 0; index < symmetry; index += 1) {
    const angle = rotation + (360 / symmetry) * index;
    elements.push(
      ...shadowed(
        {
          kind: 'ellipse',
          cx: 50,
          cy: round(50 - orbit),
          rx: round(petalWidth),
          ry: round(petalHeight),
          transform: `rotate(${round(angle)} 50 50)`,
        },
        index % 2 === 0 ? 'base' : 'accent',
        { opacity: 0.82 },
      ),
    );
  }

  if (complexity === 'dense') {
    for (let index = 0; index < symmetry; index += 1) {
      const angle = rotation + 180 / symmetry + (360 / symmetry) * index;
      elements.push({
        kind: 'ellipse',
        cx: 50,
        cy: round(50 - orbit * 0.62),
        rx: round(petalWidth * 0.46),
        ry: round(petalHeight * 0.62),
        transform: `rotate(${round(angle)} 50 50)`,
        fillTone: 'highlight',
        fillOpacity: 0.34,
      });
    }
  }

  elements.push(
    ...shadowed(
      { kind: 'circle', cx: 50, cy: 50, r: round(randomBetween(random, 12, 16)) },
      'accent',
      { opacity: 0.94 },
    ),
    {
      kind: 'circle',
      cx: 50,
      cy: 50,
      r: round(randomBetween(random, 5.5, 8.5)),
      fillTone: 'highlight',
      fillOpacity: 0.72,
      strokeTone: 'stroke',
      strokeOpacity: 0.48,
      strokeWidth: 0.9,
    },
  );

  return elements;
}

function orbitElements(
  random: () => number,
  symmetry: number,
  rotation: number,
  complexity: AgentSigilComplexity,
): AgentSigilElement[] {
  const elements: AgentSigilElement[] = [];
  const orbit = randomBetween(random, 18, 25);
  const radius = randomBetween(random, 9.5, 14.5);

  for (let index = 0; index < symmetry; index += 1) {
    const angle = rotation + (360 / symmetry) * index;
    const point = polar(orbit, angle);
    elements.push(
      ...shadowed(
        {
          kind: 'circle',
          cx: round(point.x),
          cy: round(point.y),
          r: round(radius * (index % 2 === 0 ? 1 : 0.86)),
        },
        index % 3 === 0 ? 'accent' : 'base',
        { opacity: 0.78 },
      ),
    );
  }

  if (complexity !== 'quiet') {
    const secondaryRadius = radius * 0.38;
    for (let index = 0; index < symmetry; index += 1) {
      const angle = rotation + 180 / symmetry + (360 / symmetry) * index;
      const point = polar(orbit * 0.62, angle);
      elements.push({
        kind: 'circle',
        cx: round(point.x),
        cy: round(point.y),
        r: round(secondaryRadius),
        fillTone: 'highlight',
        fillOpacity: 0.48,
      });
    }
  }

  elements.push(
    {
      kind: 'circle',
      cx: 50,
      cy: 50,
      r: round(randomBetween(random, 14, 19)),
      fillTone: 'highlight',
      fillOpacity: 0.16,
      strokeTone: 'stroke',
      strokeOpacity: 0.8,
      strokeWidth: round(randomBetween(random, 2.2, 4.2)),
    },
    {
      kind: 'circle',
      cx: 50,
      cy: 50,
      r: round(randomBetween(random, 4, 7)),
      fillTone: 'accent',
      fillOpacity: 0.9,
      strokeTone: 'highlight',
      strokeOpacity: 0.6,
      strokeWidth: 0.8,
    },
  );

  return elements;
}

function weaveElements(
  random: () => number,
  symmetry: number,
  rotation: number,
  complexity: AgentSigilComplexity,
): AgentSigilElement[] {
  const elements: AgentSigilElement[] = [];
  const width = randomBetween(random, 12, 18);
  const height = randomBetween(random, 32, 43);
  const orbit = randomBetween(random, 11, 16);

  for (let index = 0; index < symmetry; index += 1) {
    const angle = rotation + (360 / symmetry) * index;
    const element: AgentSigilElement = {
      kind: 'rect',
      x: round(50 - width / 2),
      y: round(50 - orbit - height / 2),
      width: round(width),
      height: round(height),
      rx: round(width * randomBetween(random, 0.38, 0.5)),
      transform: `rotate(${round(angle)} 50 50)`,
    };
    elements.push(
      ...shadowed(element, index % 2 === 0 ? 'base' : 'accent', {
        opacity: complexity === 'quiet' ? 0.8 : 0.72,
      }),
    );
  }

  elements.push(
    {
      kind: 'circle',
      cx: 50,
      cy: 50,
      r: round(randomBetween(random, 10, 14)),
      fillTone: 'shadow',
      fillOpacity: 0.24,
    },
    {
      kind: 'circle',
      cx: 50,
      cy: 50,
      r: round(randomBetween(random, 6, 9)),
      fillTone: 'highlight',
      fillOpacity: 0.68,
      strokeTone: 'stroke',
      strokeOpacity: 0.48,
      strokeWidth: 0.9,
    },
  );

  return elements;
}

function tileElements(
  random: () => number,
  symmetry: number,
  rotation: number,
  complexity: AgentSigilComplexity,
): AgentSigilElement[] {
  const elements: AgentSigilElement[] = [];
  const size = randomBetween(random, 20, 28);
  const orbit = randomBetween(random, 15, 21);

  for (let index = 0; index < symmetry; index += 1) {
    const angle = rotation + (360 / symmetry) * index;
    const point = polar(orbit, angle);
    elements.push(
      ...shadowed(
        {
          kind: 'rect',
          x: round(point.x - size / 2),
          y: round(point.y - size / 2),
          width: round(size),
          height: round(size),
          rx: round(size * randomBetween(random, 0.18, 0.34)),
          transform: `rotate(${round(angle + 45)} ${round(point.x)} ${round(point.y)})`,
        },
        index % 2 === 0 ? 'base' : 'accent',
        { opacity: 0.84 },
      ),
    );
  }

  if (complexity === 'dense') {
    elements.push({
      kind: 'rect',
      x: 38,
      y: 38,
      width: 24,
      height: 24,
      rx: 7,
      transform: `rotate(${round(rotation + 45)} 50 50)`,
      fillTone: 'highlight',
      fillOpacity: 0.46,
      strokeTone: 'stroke',
      strokeOpacity: 0.42,
      strokeWidth: 0.8,
    });
  } else {
    elements.push({
      kind: 'circle',
      cx: 50,
      cy: 50,
      r: round(randomBetween(random, 6, 10)),
      fillTone: 'highlight',
      fillOpacity: 0.7,
      strokeTone: 'stroke',
      strokeOpacity: 0.5,
      strokeWidth: 0.8,
    });
  }

  return elements;
}

function bloomElements(
  random: () => number,
  symmetry: number,
  rotation: number,
  complexity: AgentSigilComplexity,
): AgentSigilElement[] {
  const elements: AgentSigilElement[] = [];
  const orbit = randomBetween(random, 14, 19);
  const radius = randomBetween(random, 12, 17);

  for (let index = 0; index < symmetry; index += 1) {
    const angle = rotation + (360 / symmetry) * index;
    const point = polar(orbit, angle);
    elements.push(
      ...shadowed(
        {
          kind: 'ellipse',
          cx: round(point.x),
          cy: round(point.y),
          rx: round(radius),
          ry: round(radius * randomBetween(random, 0.68, 0.92)),
          transform: `rotate(${round(angle + 90)} ${round(point.x)} ${round(point.y)})`,
        },
        index % 2 === 0 ? 'base' : 'accent',
        { opacity: complexity === 'quiet' ? 0.72 : 0.66 },
      ),
    );
  }

  elements.push(
    {
      kind: 'circle',
      cx: 50,
      cy: 50,
      r: round(randomBetween(random, 13, 18)),
      fillTone: 'accent',
      fillOpacity: 0.44,
      strokeTone: 'highlight',
      strokeOpacity: 0.46,
      strokeWidth: 1.2,
    },
    {
      kind: 'circle',
      cx: 50,
      cy: 50,
      r: round(randomBetween(random, 5, 8)),
      fillTone: 'highlight',
      fillOpacity: 0.8,
      strokeTone: 'stroke',
      strokeOpacity: 0.44,
      strokeWidth: 0.9,
    },
  );

  return elements;
}

function symmetryFor(random: () => number, family: AgentSigilFamily, complexity: AgentSigilComplexity) {
  if (family === 'tiles') return complexity === 'dense' ? 6 : 4;
  if (family === 'weave') return complexity === 'quiet' ? 4 : choose(random, [4, 5, 6] as const);
  if (complexity === 'quiet') return choose(random, [3, 4, 5] as const);
  if (complexity === 'dense') return choose(random, [5, 6, 7, 8] as const);
  return choose(random, [4, 5, 6] as const);
}

export function agentSigilToneColor(recipe: AgentSigilRecipe, tone: AgentSigilTone | undefined) {
  return tone ? recipe.palette[tone] : 'none';
}

export function createAgentSigilRecipe(options: GenerateAgentSigilOptions): AgentSigilRecipe {
  const version = options.version ?? AGENT_SIGIL_RENDERER_VERSION;
  if (version !== AGENT_SIGIL_RENDERER_VERSION) {
    throw new Error(`Unsupported agent sigil renderer version: ${version}`);
  }

  const seed = options.seed.trim();
  if (!seed) throw new Error('Agent sigil seed must not be empty.');
  if (seed.length > 256) throw new Error('Agent sigil seed must contain at most 256 characters.');

  const nonce = Math.max(0, Math.floor(options.nonce ?? 0));
  const complexity = options.complexity ?? 'regular';
  const paletteMode = options.palette ?? 'auto';
  const input = `${version}:${nonce}:${complexity}:${paletteMode}:${seed}`;
  const hash = hashString(input);
  const random = createRandom(hash);
  const family = choose(random, agentSigilFamilies);
  const palette = paletteFor(random, paletteMode);
  const symmetry = symmetryFor(random, family, complexity);
  const rotation = round(randomBetween(random, 0, 360));

  let elements: AgentSigilElement[];
  if (family === 'rosette') {
    elements = rosetteElements(random, symmetry, rotation, complexity);
  } else if (family === 'orbit') {
    elements = orbitElements(random, symmetry, rotation, complexity);
  } else if (family === 'weave') {
    elements = weaveElements(random, symmetry, rotation, complexity);
  } else if (family === 'tiles') {
    elements = tileElements(random, symmetry, rotation, complexity);
  } else {
    elements = bloomElements(random, symmetry, rotation, complexity);
  }

  const fingerprint = hash.toString(16).padStart(8, '0');
  return {
    version,
    seed,
    nonce,
    fingerprint,
    family,
    paletteName: palette.name,
    palette,
    complexity,
    symmetry,
    rotation,
    elements,
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

function formatNumber(value: number) {
  return String(round(value));
}

function elementAttributes(recipe: AgentSigilRecipe, element: AgentSigilElement) {
  const attributes = [
    `fill="${agentSigilToneColor(recipe, element.fillTone)}"`,
    element.fillOpacity === undefined ? null : `fill-opacity="${formatNumber(element.fillOpacity)}"`,
    element.strokeTone ? `stroke="${agentSigilToneColor(recipe, element.strokeTone)}"` : null,
    element.strokeOpacity === undefined ? null : `stroke-opacity="${formatNumber(element.strokeOpacity)}"`,
    element.strokeWidth === undefined ? null : `stroke-width="${formatNumber(element.strokeWidth)}"`,
    element.transform ? `transform="${element.transform}"` : null,
  ];
  return attributes.filter(Boolean).join(' ');
}

export function renderAgentSigilSvg(
  recipe: AgentSigilRecipe,
  options: { size?: number; label?: string } = {},
) {
  const size = Math.max(1, Math.min(2048, Math.floor(options.size ?? 100)));
  const label = options.label ?? `Generated ${recipe.family} agent sigil ${recipe.fingerprint}`;
  const elements = recipe.elements
    .map((element) => {
      const attributes = elementAttributes(recipe, element);
      if (element.kind === 'circle') {
        return `<circle cx="${formatNumber(element.cx)}" cy="${formatNumber(element.cy)}" r="${formatNumber(element.r)}" ${attributes}/>`;
      }
      if (element.kind === 'ellipse') {
        return `<ellipse cx="${formatNumber(element.cx)}" cy="${formatNumber(element.cy)}" rx="${formatNumber(element.rx)}" ry="${formatNumber(element.ry)}" ${attributes}/>`;
      }
      return `<rect x="${formatNumber(element.x)}" y="${formatNumber(element.y)}" width="${formatNumber(element.width)}" height="${formatNumber(element.height)}" rx="${formatNumber(element.rx)}" ${attributes}/>`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100" role="img" aria-label="${escapeXml(label)}" fill="none" stroke-linecap="round" stroke-linejoin="round">${elements}</svg>`;
}

export function generateAgentSigil(options: GenerateAgentSigilOptions): GeneratedAgentSigil {
  const recipe = createAgentSigilRecipe(options);
  const accessibleLabel = `Generated ${recipe.family} agent sigil ${recipe.fingerprint}`;
  const svg = renderAgentSigilSvg(recipe, { label: accessibleLabel });
  return {
    recipe,
    svg,
    dataUri: `data:image/svg+xml,${encodeURIComponent(svg)}`,
    accessibleLabel,
  };
}
