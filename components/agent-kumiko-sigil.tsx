import {
  createAgentKumikoSigilRecipe,
  type AgentKumikoSigilInput,
  type AgentKumikoSigilRecipe,
} from '@/lib/agent-kumiko-sigils';
import type { AgentSigilTone } from '@/lib/agent-sigils';

export type AgentKumikoSigilProps = AgentKumikoSigilInput & {
  recipe?: AgentKumikoSigilRecipe;
  size?: number;
  className?: string;
  label?: string | null;
  monochrome?: boolean;
  debug?: boolean;
};

function toneColor(
  recipe: AgentKumikoSigilRecipe,
  tone: AgentSigilTone,
  monochrome: boolean,
) {
  return monochrome ? 'currentColor' : recipe.palette[tone];
}

export default function AgentKumikoSigil({
  recipe: providedRecipe,
  size = 48,
  className,
  label,
  monochrome = false,
  debug = false,
  ...input
}: AgentKumikoSigilProps) {
  const recipe = providedRecipe ?? createAgentKumikoSigilRecipe(input);
  const accessibleLabel =
    label === undefined
      ? `${recipe.identity.designation} experimental Kumiko-informed generation ${recipe.generation} sigil ${recipe.fingerprint}`
      : label;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role={accessibleLabel ? 'img' : undefined}
      aria-label={accessibleLabel ?? undefined}
      aria-hidden={accessibleLabel === null ? true : undefined}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      data-agent-kumiko={recipe.fingerprint}
      data-agent-kumiko-family={recipe.family}
      data-agent-kumiko-graph={recipe.graphFingerprint}
      data-agent-kumiko-occupancy={recipe.occupancyDescriptor}
      data-agent-kumiko-lattice={recipe.layerFingerprints.lattice}
      data-agent-kumiko-infill={recipe.layerFingerprints.infill}
      data-agent-kumiko-accents={recipe.layerFingerprints.accents}
      data-agent-kumiko-palette={recipe.layerFingerprints.palette}
    >
      {accessibleLabel ? <title>{accessibleLabel}</title> : null}
      {recipe.struts.map((strut, index) => {
        const from = recipe.nodes[strut.from]!;
        const to = recipe.nodes[strut.to]!;
        return (
          <line
            key={`strut-${index}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={toneColor(recipe, strut.tone, monochrome)}
            strokeOpacity={strut.opacity}
            strokeWidth={strut.width}
            data-kumiko-strut-role={strut.role}
          />
        );
      })}
      {recipe.joints.map((joint, index) => {
        const point = recipe.nodes[joint.node]!;
        return (
          <circle
            key={`joint-${index}`}
            cx={point.x}
            cy={point.y}
            r={joint.radius}
            fill={toneColor(recipe, joint.tone, monochrome)}
            fillOpacity={joint.opacity}
            data-kumiko-joint
          />
        );
      })}
      {debug
        ? recipe.nodes.map((point, index) => (
            <g key={`debug-${index}`} data-kumiko-debug-node>
              <circle
                cx={point.x}
                cy={point.y}
                r={1.15}
                fill="none"
                stroke="currentColor"
                strokeOpacity={0.45}
                strokeWidth={0.55}
              />
              <text
                x={point.x + 1.8}
                y={point.y - 1.8}
                fill="currentColor"
                fillOpacity={0.55}
                fontSize={3}
              >
                {index}
              </text>
            </g>
          ))
        : null}
    </svg>
  );
}
