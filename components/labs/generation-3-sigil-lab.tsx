import AgentGeneration3Sigil from '@/components/agent-generation-3-sigil';
import {
  createAgentGeneration3SigilRecipe,
  createDistinctAgentGeneration3Population,
  type AgentGeneration3SigilInput,
} from '@/lib/agent-generation-3-sigils';
import { agentKumikoFamilies } from '@/lib/agent-kumiko-sigils';

const generation3Identities: AgentGeneration3SigilInput[] = [
  {
    scope: 'openai/codex',
    designation: 'Testing review',
    description: 'Found three actionable test findings in the current patch.',
  },
  {
    scope: 'openai/codex',
    designation: 'Change size',
    description: 'Split a large patch below the repository review threshold.',
  },
  {
    scope: 'openai/codex',
    designation: 'Context review',
    description: 'Checked the model-visible context for missing constraints.',
  },
  {
    scope: 'openai/codex',
    designation: 'Breaking changes',
    description: 'Reviewed the public surface for compatibility changes.',
  },
  {
    scope: 'teamleaderleo/scrapbook',
    designation: 'Testing audit',
    description: 'Verified the current browser and unit coverage before handoff.',
  },
  {
    scope: 'teamleaderleo/scrapbook',
    designation: 'Breaking Changes final',
    description: 'Closed the last material documentation correction.',
  },
  {
    scope: 'teamleaderleo/stensibly',
    designation: 'Context audit',
    description: 'Checked the active coordination lanes and their handoffs.',
  },
  {
    scope: 'teamleaderleo/proofwake',
    designation: 'Size review',
    description: 'Measured a focused patch against the project review boundary.',
  },
  {
    scope: 'teamleaderleo/scrapbook',
    designation: 'Agent 1 coordination',
    description: 'Integrated clean work and kept acceptance-blocked work isolated.',
  },
  {
    scope: 'teamleaderleo/scrapbook',
    designation: 'Agent 2 behaviour review',
    description: 'Checked input behaviour and shortcut ownership.',
  },
  {
    scope: 'teamleaderleo/scrapbook',
    designation: 'Agent 3 regression audit',
    description: 'Reviewed the time control and browser regression surface.',
  },
  {
    scope: 'teamleaderleo/scrapbook',
    designation: 'Agent 4 visual review',
    description: 'Compared the shared visual language across current surfaces.',
  },
  {
    scope: 'teamleaderleo/scrapbook',
    designation: 'Agent 5 integration',
    description: 'Reconciled the compact homepage and its browser evidence.',
  },
  {
    scope: 'teamleaderleo/stensibly',
    designation: 'Thread Compass',
    description: 'Mapped four moving lanes and documented the next handoff.',
  },
  {
    scope: 'teamleaderleo/scrapbook',
    designation: 'Fifth Drawer',
    description: 'Audited the crowded workbench and divided the next pass.',
  },
  {
    scope: 'teamleaderleo/gh-tidy-branches',
    designation: 'Release Raccoon',
    description: 'Found the release metadata trap and verified installation.',
  },
  {
    scope: 'teamleaderleo/scrapbook',
    designation: 'Codex Routekeeper',
    description: 'Kept old pages visible while routes warmed.',
  },
  {
    scope: 'teamleaderleo/scrapbook',
    designation: 'Mothbit Gallery Room',
    description: 'Built the first draggable gallery scene without trapping scroll.',
  },
];

const populationInputs = generation3Identities.map((identity, index) => ({
  ...identity,
  family: agentKumikoFamilies[index % agentKumikoFamilies.length],
  complexity: 'quiet' as const,
}));

const populationRecipes = createDistinctAgentGeneration3Population(populationInputs, {
  minimumOccupancyDistance: 8,
});

const densityIdentities: Array<AgentGeneration3SigilInput & { label: string }> = [
  {
    label: 'Testing review',
    scope: 'openai/codex',
    designation: 'Testing review',
    description: 'Found three actionable test findings.',
    family: 'triangular-brace',
    complexity: 'quiet',
  },
  {
    label: 'Context audit',
    scope: 'teamleaderleo/stensibly',
    designation: 'Context audit',
    description: 'Checked the current coordination handoff.',
    family: 'hex-cell',
    complexity: 'quiet',
  },
  {
    label: 'Release Raccoon',
    scope: 'teamleaderleo/gh-tidy-branches',
    designation: 'Release Raccoon',
    description: 'Verified the release metadata path.',
    family: 'diamond-weave',
    complexity: 'quiet',
  },
  {
    label: 'Thread Compass',
    scope: 'teamleaderleo/stensibly',
    designation: 'Thread Compass',
    description: 'Mapped the next handoff.',
    family: 'nested-joint',
    complexity: 'quiet',
  },
];

const descriptionExamples: Array<AgentGeneration3SigilInput & { label: string }> = [
  {
    label: 'Baseline',
    scope: 'teamleaderleo/scrapbook',
    designation: 'Testing review',
    description: 'Found three actionable test findings.',
    family: 'diamond-weave',
    paletteMode: 'tri-colour',
    complexity: 'quiet',
  },
  {
    label: 'Assignment changed',
    scope: 'teamleaderleo/scrapbook',
    designation: 'Testing review',
    description: 'Reviewed release documentation and compatibility notes.',
    family: 'diamond-weave',
    paletteMode: 'tri-colour',
    complexity: 'quiet',
  },
  {
    label: 'No assignment accent',
    scope: 'teamleaderleo/scrapbook',
    designation: 'Testing review',
    family: 'diamond-weave',
    paletteMode: 'tri-colour',
    complexity: 'quiet',
  },
];

export function Generation3SigilLab() {
  return (
    <div className="space-y-5" data-generation-3-combined-lab>
      <section className="rounded-[1.4rem] border border-border/70 bg-card/85 p-4 shadow-[0_18px_42px_rgba(28,26,24,0.08)] dark:shadow-[0_18px_42px_rgba(0,0,0,0.24)] sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">
              Issue #443 · combined Generation 3 experiment
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">
              Quiet lattices with cohesive colour roles
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            Geometry and palette remain independent deterministic recipes. The combined mark
            assigns one job to each colour role and keeps description-derived highlights
            optional at compact sizes.
          </p>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Dominant', 'Primary struts'],
            ['Support', 'Secondary relations and normal joints'],
            ['Highlight', 'At most one work-note event'],
            ['Neutral', 'Joint outline and contrast'],
          ].map(([role, use]) => (
            <div key={role} className="rounded-xl border border-border/65 bg-background p-3">
              <p className="font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {role}
              </p>
              <p className="mt-1 text-sm">{use}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        data-generation-3-population
        className="rounded-[1.4rem] border border-border/70 bg-card/85 p-4 sm:p-5"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">
              Labels-hidden combined population
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">
              Colour enriches the graph without rebuilding it
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            Eighteen identities use quiet geometry, graph-distance selection, canonical
            palette variants, and automatic light/dark role mappings.
          </p>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-9">
          {populationRecipes.map((recipe, index) => (
            <div
              key={`${recipe.geometry.identity.scope}:${recipe.geometry.identity.designation}`}
              data-generation-3-population-card
              data-generation-3-population-graph={recipe.geometry.graphFingerprint}
              data-generation-3-population-palette={recipe.palette.fingerprint}
              className="grid aspect-square place-items-center rounded-xl border border-border/65 bg-background p-2"
            >
              <AgentGeneration3Sigil
                {...populationInputs[index]!}
                recipe={recipe}
                size={58}
                label={null}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[1.4rem] border border-border/70 bg-card/85 p-4 sm:p-5">
        <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">
          Same graph · three colour densities
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight">
          Monochrome, duotone, and tri-colour remain recognisably related
        </h2>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {densityIdentities.map(({ label, ...input }) => (
            <article
              key={label}
              data-generation-3-density-card
              className="rounded-[1.1rem] border border-border/70 bg-background p-3"
            >
              <div className="grid grid-cols-3 gap-2">
                <div className="grid place-items-center gap-1.5">
                  <AgentGeneration3Sigil
                    {...input}
                    paletteMode="tri-colour"
                    surface="monochrome"
                    size={54}
                  />
                  <span className="font-mono text-[8px] uppercase tracking-[0.08em] text-muted-foreground">
                    mono
                  </span>
                </div>
                <div className="grid place-items-center gap-1.5">
                  <AgentGeneration3Sigil {...input} paletteMode="duotone" size={54} />
                  <span className="font-mono text-[8px] uppercase tracking-[0.08em] text-muted-foreground">
                    duo
                  </span>
                </div>
                <div className="grid place-items-center gap-1.5">
                  <AgentGeneration3Sigil {...input} paletteMode="tri-colour" size={54} />
                  <span className="font-mono text-[8px] uppercase tracking-[0.08em] text-muted-foreground">
                    tri
                  </span>
                </div>
              </div>
              <p className="mt-2 truncate text-center text-xs font-medium">{label}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid min-w-0 gap-5 lg:grid-cols-2">
        <div className="rounded-[1.4rem] border border-border/70 bg-card/85 p-4 sm:p-5">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">
            Description isolation
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">
            Work notes change highlights, not graph or colour world
          </h2>
          <div className="mt-4 grid grid-cols-3 gap-2.5">
            {descriptionExamples.map(({ label, ...input }) => {
              const recipe = createAgentGeneration3SigilRecipe(input);
              return (
                <div
                  key={label}
                  data-generation-3-description-example
                  className="grid place-items-center rounded-xl border border-border/65 bg-background p-3 text-center"
                >
                  <AgentGeneration3Sigil {...input} recipe={recipe} size={68} />
                  <span className="mt-2 text-xs font-medium">{label}</span>
                  <span className="mt-1 font-mono text-[8px] uppercase tracking-[0.08em] text-muted-foreground">
                    {recipe.layerFingerprints.geometry.slice(0, 4)} ·{' '}
                    {recipe.layerFingerprints.palette.slice(0, 4)} ·{' '}
                    {recipe.layerFingerprints.accents.slice(0, 4)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div
          data-generation-3-small-sizes
          className="rounded-[1.4rem] border border-border/70 bg-card/85 p-4 sm:p-5"
        >
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">
            Compact role reduction
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">
            The highlight disappears before the identity does
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            At 16 and 24 px, description-derived highlights are omitted. Dominant and support
            relations retain the same graph, palette fingerprint, and overall identity.
          </p>
          <div className="mt-5 flex items-end justify-center gap-5 rounded-xl border border-border/65 bg-background px-4 py-5">
            {[16, 24, 32, 48, 72].map((size) => (
              <div key={size} className="grid place-items-center gap-1">
                <AgentGeneration3Sigil
                  scope="teamleaderleo/scrapbook"
                  designation="Compact review"
                  description="Highlight one reviewed joint."
                  family="star-joint"
                  paletteMode="tri-colour"
                  size={size}
                />
                <span className="font-mono text-[8px] text-muted-foreground">{size}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
