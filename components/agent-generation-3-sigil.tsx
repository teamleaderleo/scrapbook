import {
  createAgentGeneration3SigilRecipe,
  type AgentGeneration3SigilInput,
  type AgentGeneration3SigilRecipe,
  type AgentGeneration3Surface,
} from '@/lib/agent-generation-3-sigils';
import type { Generation3PaletteRole } from '@/lib/agent-sigil-generation-3-palettes';
import type { CSSProperties } from 'react';

export type AgentGeneration3SigilProps = AgentGeneration3SigilInput & {
  recipe?: AgentGeneration3SigilRecipe;
  size?: number;
  className?: string;
  label?: string | null;
  surface?: AgentGeneration3Surface | 'auto';
  compact?: boolean;
};

type PaletteVariableStyle = CSSProperties & Record<`--g3-${string}`, string>;

const automaticSurfaceClass = [
  '[--g3-dominant:var(--g3-dominant-light)]',
  '[--g3-support:var(--g3-support-light)]',
  '[--g3-highlight:var(--g3-highlight-light)]',
  '[--g3-neutral:var(--g3-neutral-light)]',
  'dark:[--g3-dominant:var(--g3-dominant-dark)]',
  'dark:[--g3-support:var(--g3-support-dark)]',
  'dark:[--g3-highlight:var(--g3-highlight-dark)]',
  'dark:[--g3-neutral:var(--g3-neutral-dark)]',
].join(' ');

function paletteStyle(
  recipe: AgentGeneration3SigilRecipe,
  surface: AgentGeneration3Surface | 'auto',
): PaletteVariableStyle {
  if (surface !== 'auto') {
    const roles = recipe.palette[surface];
    return {
      '--g3-dominant': roles.dominant,
      '--g3-support': roles.support,
      '--g3-highlight': roles.highlight,
      '--g3-neutral': roles.neutral,
    };
  }

  return {
    '--g3-dominant': recipe.palette.light.dominant,
    '--g3-support': recipe.palette.light.support,
    '--g3-highlight': recipe.palette.light.highlight,
    '--g3-neutral': recipe.palette.light.neutral,
    '--g3-dominant-light': recipe.palette.light.dominant,
    '--g3-support-light': recipe.palette.light.support,
    '--g3-highlight-light': recipe.palette.light.highlight,
    '--g3-neutral-light': recipe.palette.light.neutral,
    '--g3-dominant-dark': recipe.palette.dark.dominant,
    '--g3-support-dark': recipe.palette.dark.support,
    '--g3-highlight-dark': recipe.palette.dark.highlight,
    '--g3-neutral-dark': recipe.palette.dark.neutral,
  };
}

function roleForStrut(
  recipe: AgentGeneration3SigilRecipe,
  index: number,
): Generation3PaletteRole {
  const strut = recipe.geometry.struts[index]!;
  if (index === recipe.accentStrutIndex || strut.role === 'accent') return 'highlight';
  return strut.role === 'primary' ? 'dominant' : 'support';
}

export default function AgentGeneration3Sigil({
  recipe: providedRecipe,
  size = 48,
  className,
  label,
  surface = 'auto',
  compact: compactOverride,
  ...input
}: AgentGeneration3SigilProps) {
  const recipe = providedRecipe ?? createAgentGeneration3SigilRecipe(input);
  const compact = compactOverride ?? size <= 24;
  const accessibleLabel =
    label === undefined
      ? `${recipe.geometry.identity.designation} Generation 3 ${recipe.geometry.family} sigil ${recipe.fingerprint}`
      : label;
  const surfaceClass = surface === 'auto' ? automaticSurfaceClass : '';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`${surfaceClass} ${className ?? ''}`.trim()}
      style={paletteStyle(recipe, surface)}
      role={accessibleLabel ? 'img' : undefined}
      aria-label={accessibleLabel ?? undefined}
      aria-hidden={accessibleLabel === null ? true : undefined}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      data-agent-generation-3={recipe.fingerprint}
      data-generation-3-family={recipe.geometry.family}
      data-generation-3-graph={recipe.geometry.graphFingerprint}
      data-generation-3-geometry={recipe.layerFingerprints.geometry}
      data-generation-3-accents={recipe.layerFingerprints.accents}
      data-generation-3-palette-fingerprint={recipe.layerFingerprints.palette}
      data-generation-3-palette-family={recipe.palette.familyId}
      data-generation-3-palette-mode={recipe.palette.mode}
      data-generation-3-palette-variant={recipe.palette.paletteVariant}
      data-generation-3-compact={compact ? 'true' : 'false'}
    >
      {accessibleLabel ? <title>{accessibleLabel}</title> : null}
      {recipe.geometry.struts.map((strut, index) => {
        const role = roleForStrut(recipe, index);
        if (compact && role === 'highlight') return null;
        const from = recipe.geometry.nodes[strut.from]!;
        const to = recipe.geometry.nodes[strut.to]!;
        return (
          <line
            key={`strut-${index}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={`var(--g3-${role})`}
            strokeOpacity={strut.opacity}
            strokeWidth={strut.width}
            data-generation-3-role={role}
          />
        );
      })}
      {recipe.geometry.joints.map((joint, index) => {
        const accent = index === recipe.accentJointIndex;
        if (compact && accent) return null;
        const point = recipe.geometry.nodes[joint.node]!;
        const role: Generation3PaletteRole = accent ? 'highlight' : 'support';
        return (
          <circle
            key={`joint-${index}`}
            cx={point.x}
            cy={point.y}
            r={joint.radius}
            fill={`var(--g3-${role})`}
            fillOpacity={joint.opacity}
            stroke="var(--g3-neutral)"
            strokeWidth={0.65}
            data-generation-3-role={role}
          />
        );
      })}
    </svg>
  );
}
