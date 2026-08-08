import AgentIdentitySigil from '@/components/agent-identity-sigil';
import AgentKumikoSigil from '@/components/agent-kumiko-sigil';
import {
  agentKumikoFamilies,
  agentKumikoOccupancyDistance,
  createAgentKumikoSigilRecipe,
  createDistinctAgentKumikoPopulation,
  type AgentKumikoSigilInput,
} from '@/lib/agent-kumiko-sigils';

const kumikoIdentities: AgentKumikoSigilInput[] = [
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

const contactInputs = kumikoIdentities.map((identity, index) => ({
  ...identity,
  family: agentKumikoFamilies[index % agentKumikoFamilies.length],
}));

const contactRecipes = createDistinctAgentKumikoPopulation(contactInputs, {
  minimumOccupancyDistance: 8,
});

const minimumPopulationDistance = contactRecipes.reduce((minimum, recipe, index) => {
  const distances = contactRecipes
    .slice(0, index)
    .map((other) =>
      agentKumikoOccupancyDistance(recipe.occupancyDescriptor, other.occupancyDescriptor),
    );
  return distances.length === 0 ? minimum : Math.min(minimum, ...distances);
}, Number.POSITIVE_INFINITY);

const layerExamples: Array<AgentKumikoSigilInput & { label: string }> = [
  {
    label: 'Baseline',
    scope: 'teamleaderleo/scrapbook',
    designation: 'Testing review',
    description: 'Found three actionable test findings.',
    family: 'diamond-weave',
    complexity: 'regular',
  },
  {
    label: 'Assignment changed',
    scope: 'teamleaderleo/scrapbook',
    designation: 'Testing review',
    description: 'Reviewed release documentation and compatibility notes.',
    family: 'diamond-weave',
    complexity: 'regular',
  },
  {
    label: 'No assignment accent',
    scope: 'teamleaderleo/scrapbook',
    designation: 'Testing review',
    family: 'diamond-weave',
    complexity: 'regular',
  },
];

export function KumikoSigilLab() {
  return (
    <div className="space-y-5" data-kumiko-lab>
      <section className="rounded-[1.4rem] border border-border/70 bg-card/85 p-4 shadow-[0_18px_42px_rgba(28,26,24,0.08)] dark:shadow-[0_18px_42px_rgba(0,0,0,0.24)] sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">
              Lattice studies
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">
              Marks built from joints and open space
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            Thin struts, visible joints, and protected gaps replace the usual
            rings and orbiting pieces. These borrow a construction idea from
            lattice work without pretending to reproduce the craft.
          </p>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <div className="rounded-xl border border-border/65 bg-background p-3">
            <p className="font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Scope
            </p>
            <p className="mt-1 text-sm">Family, proportion, rotation, and reflection</p>
          </div>
          <div className="rounded-xl border border-border/65 bg-background p-3">
            <p className="font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Designation
            </p>
            <p className="mt-1 text-sm">Joint cadence, retained braces, and internal infill</p>
          </div>
          <div className="rounded-xl border border-border/65 bg-background p-3">
            <p className="font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Description
            </p>
            <p className="mt-1 text-sm">One highlighted strut or joint; geometry stays fixed</p>
          </div>
        </div>
      </section>

      <section
        data-kumiko-contact-sheet
        data-kumiko-minimum-distance={minimumPopulationDistance}
        className="rounded-[1.4rem] border border-border/70 bg-card/85 p-4 sm:p-5"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">
              Without labels or colour
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">
              The shape has to do the work first
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            Each mark must remain recognisably separate even as a tiny black
            shape. Closest measured separation:{' '}
            {Number.isFinite(minimumPopulationDistance) ? minimumPopulationDistance : 0}.
          </p>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-9">
          {contactRecipes.map((recipe) => (
            <div
              key={`${recipe.identity.scope}:${recipe.identity.designation}`}
              data-kumiko-contact-card
              data-kumiko-family={recipe.family}
              data-kumiko-graph={recipe.graphFingerprint}
              data-kumiko-occupancy={recipe.occupancyDescriptor}
              className="grid aspect-square place-items-center rounded-xl border border-border/65 bg-background p-2 text-foreground"
            >
              <AgentKumikoSigil
                {...recipe.identity}
                recipe={recipe}
                size={58}
                monochrome
                label={`${recipe.identity.designation} monochrome Kumiko-informed lattice`}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[1.4rem] border border-border/70 bg-card/85 p-4 sm:p-5">
        <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">
          Same identities · different lineage
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight">
          Generation 2 beside the lattice experiment
        </h2>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {kumikoIdentities.slice(0, 6).map((identity, index) => {
            const kumikoInput = {
              ...identity,
              family: agentKumikoFamilies[index % agentKumikoFamilies.length],
            };
            const recipe = createAgentKumikoSigilRecipe(kumikoInput);
            return (
              <article
                key={`${identity.scope}:${identity.designation}`}
                data-kumiko-comparison
                className="rounded-[1.1rem] border border-border/70 bg-background p-3"
              >
                <div className="flex items-center justify-center gap-5">
                  <div className="grid place-items-center gap-1.5">
                    <AgentIdentitySigil {...identity} size={58} />
                    <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted-foreground">
                      Generation 2
                    </span>
                  </div>
                  <div className="h-12 w-px bg-border" aria-hidden="true" />
                  <div className="grid place-items-center gap-1.5">
                    <AgentKumikoSigil {...kumikoInput} recipe={recipe} size={58} />
                    <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted-foreground">
                      {recipe.family}
                    </span>
                  </div>
                </div>
                <p className="mt-2 truncate text-center text-xs font-medium">
                  {identity.designation}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-[1.4rem] border border-border/70 bg-card/85 p-4 sm:p-5">
        <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">
          Eight construction families
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight">
          Different topologies, not one badge with renamed parameters
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 xl:grid-cols-8">
          {agentKumikoFamilies.map((family) => {
            const input = {
              scope: `lab/${family}`,
              designation: 'Lattice specimen',
              description: 'Highlight one reviewed joint.',
              family,
              complexity: 'regular' as const,
            };
            const recipe = createAgentKumikoSigilRecipe(input);
            return (
              <div
                key={family}
                data-kumiko-family-card
                data-kumiko-family={family}
                className="grid min-w-0 place-items-center rounded-xl border border-border/65 bg-background p-3 text-center"
              >
                <AgentKumikoSigil {...input} recipe={recipe} size={68} />
                <span className="mt-2 text-[10px] font-medium leading-tight">
                  {family.replaceAll('-', ' ')}
                </span>
                <span className="mt-1 font-mono text-[8px] uppercase tracking-[0.08em] text-muted-foreground">
                  {recipe.struts.length} struts · {recipe.protectedVoids} voids
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid min-w-0 gap-5 lg:grid-cols-2">
        <div className="rounded-[1.4rem] border border-border/70 bg-card/85 p-4 sm:p-5">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">
            Description isolation
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">
            Assignment edits change an accent, not the graph
          </h2>
          <div className="mt-4 grid grid-cols-3 gap-2.5">
            {layerExamples.map(({ label, ...input }) => {
              const recipe = createAgentKumikoSigilRecipe(input);
              return (
                <div
                  key={label}
                  data-kumiko-layer-example
                  className="grid place-items-center rounded-xl border border-border/65 bg-background p-3 text-center"
                >
                  <AgentKumikoSigil {...input} recipe={recipe} size={68} />
                  <span className="mt-2 text-xs font-medium">{label}</span>
                  <span className="mt-1 font-mono text-[8px] uppercase tracking-[0.08em] text-muted-foreground">
                    {recipe.graphFingerprint.slice(0, 4)} ·{' '}
                    {recipe.layerFingerprints.accents.slice(0, 4)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[1.4rem] border border-border/70 bg-card/85 p-4 sm:p-5">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">
            Construction graph overlay
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">
            Nodes and joints stay inspectable
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            The debug view exposes numbered graph nodes. The shipping renderer uses only the
            struts and selected high-degree joints.
          </p>
          <div
            data-kumiko-debug
            className="mt-4 grid place-items-center rounded-xl border border-border/65 bg-background p-4"
          >
            <AgentKumikoSigil
              scope="teamleaderleo/scrapbook"
              designation="Construction review"
              description="Inspect the selected joint."
              family="nested-joint"
              complexity="regular"
              size={150}
              debug
            />
          </div>
        </div>
      </section>

      <section
        data-kumiko-small-sizes
        className="rounded-[1.4rem] border border-border/70 bg-card/85 p-4 sm:p-5"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">
              Small-size check
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">
              Struts and voids must survive before extra infill appears
            </h2>
          </div>
          <div className="flex items-end gap-4 rounded-xl border border-border/65 bg-background px-4 py-3">
            {[16, 24, 32, 48, 72].map((size) => (
              <div key={size} className="grid place-items-center gap-1">
                <AgentKumikoSigil
                  scope="openai/codex"
                  designation="Breaking changes"
                  description="Reviewed compatibility changes."
                  family="triangular-brace"
                  size={size}
                  monochrome
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
