import {
  agentSigilToneColor,
  createAgentSigilRecipe,
  type AgentSigilElement,
  type GenerateAgentSigilOptions,
} from '@/lib/agent-sigils';

export type AgentSigilProps = GenerateAgentSigilOptions & {
  size?: number;
  className?: string;
  label?: string | null;
};

export default function AgentSigil({
  size = 48,
  className,
  label,
  ...options
}: AgentSigilProps) {
  const recipe = createAgentSigilRecipe(options);
  const accessibleLabel =
    label === undefined ? `Generated ${recipe.family} agent sigil ${recipe.fingerprint}` : label;

  const commonProps = (element: AgentSigilElement) => ({
    fill: agentSigilToneColor(recipe, element.fillTone),
    fillOpacity: element.fillOpacity,
    stroke: element.strokeTone ? agentSigilToneColor(recipe, element.strokeTone) : undefined,
    strokeOpacity: element.strokeOpacity,
    strokeWidth: element.strokeWidth,
    transform: element.transform,
  });

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
      data-agent-sigil={recipe.fingerprint}
      data-agent-sigil-family={recipe.family}
      data-agent-sigil-palette={recipe.paletteName}
    >
      {accessibleLabel ? <title>{accessibleLabel}</title> : null}
      {recipe.elements.map((element, index) => {
        if (element.kind === 'circle') {
          return (
            <circle
              key={`${element.kind}-${index}`}
              cx={element.cx}
              cy={element.cy}
              r={element.r}
              {...commonProps(element)}
            />
          );
        }
        if (element.kind === 'ellipse') {
          return (
            <ellipse
              key={`${element.kind}-${index}`}
              cx={element.cx}
              cy={element.cy}
              rx={element.rx}
              ry={element.ry}
              {...commonProps(element)}
            />
          );
        }
        return (
          <rect
            key={`${element.kind}-${index}`}
            x={element.x}
            y={element.y}
            width={element.width}
            height={element.height}
            rx={element.rx}
            {...commonProps(element)}
          />
        );
      })}
    </svg>
  );
}
