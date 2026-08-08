import AgentIdentitySigil from '@/components/agent-identity-sigil';
import AgentSigil from '@/components/agent-sigil';
import {
  createAgentIdentitySigilRecipe,
  type AgentIdentitySigilInput,
} from '@/lib/agent-identity-sigils';
import {
  generation3PaletteCatalogue,
  type Generation3PaletteFamily,
  type Generation3PaletteRoles,
  type Generation3PaletteVariant,
} from '@/lib/agent-sigil-generation-3-palettes';
import type { AgentSigilComplexity } from '@/lib/agent-sigils';

const identities: Array<AgentIdentitySigilInput> = [
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

const complexityExamples: Array<{ label: string; value: AgentSigilComplexity }> = [
  { label: 'Quiet', value: 'quiet' },
  { label: 'Regular', value: 'regular' },
  { label: 'Dense', value: 'dense' },
];

const paletteSurfaces: Array<{
  label: string;
  key: 'light' | 'dark' | 'monochrome';
}> = [
  { label: 'Light', key: 'light' },
  { label: 'Dark', key: 'dark' },
  { label: 'Mono', key: 'monochrome' },
];

function IdentityCard({ identity }: { identity: AgentIdentitySigilInput }) {
  const recipe = createAgentIdentitySigilRecipe(identity);

  return (
    <article
      data-sigil-card
      data-sigil-seed={identity.designation}
      data-sigil-fingerprint={recipe.fingerprint}
      className="flex min-w-0 items-center gap-3 rounded-[1.1rem] border border-border/70 bg-card p-3.5 shadow-[0_12px_28px_rgba(28,26,24,0.07)] dark:shadow-[0_12px_28px_rgba(0,0,0,0.2)]"
    >
      <div className="grid size-[4.5rem] shrink-0 place-items-center rounded-[1rem] border border-border/60 bg-background">
        <AgentIdentitySigil {...identity} size={60} />
      </div>
      <div className="min-w-0">
        <h3 className="truncate text-sm font-medium">{identity.designation}</h3>
        <p className="mt-1 truncate font-mono text-[9px] uppercase tracking-[0.13em] text-muted-foreground">
          {identity.scope}
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/75">
          g{recipe.generation} · {recipe.family} · {recipe.paletteName}
        </p>
      </div>
    </article>
  );
}

function PaletteRoleStrip({
  label,
  roles,
}: {
  label: string;
  roles: Generation3PaletteRoles;
}) {
  return (
    <div
      data-generation-3-palette-surface={label.toLowerCase()}
      className="grid grid-cols-[3.25rem_minmax(0,1fr)] items-center gap-2"
    >
      <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </span>
      <div className="grid h-7 grid-cols-4 overflow-hidden rounded-lg border border-border/65 bg-background">
        {Object.entries(roles).map(([role, colour]) => (
          <span
            key={role}
            data-generation-3-palette-role={role}
            title={`${role}: ${colour}`}
            style={{ backgroundColor: colour }}
          />
        ))}
      </div>
    </div>
  );
}

function Generation3PaletteCard({
  family,
  variant,
}: {
  family: Generation3PaletteFamily;
  variant: Generation3PaletteVariant;
}) {
  return (
    <article
      data-generation-3-palette={variant.id}
      data-generation-3-palette-family={family.id}
      data-generation-3-palette-mode={family.mode}
      className="min-w-0 rounded-[1rem] border border-border/65 bg-background p-3"
    >
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium">{family.label}</h3>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{variant.label}</p>
        </div>
        <span className="shrink-0 rounded-full border border-border/65 px-2 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          {family.mode}
        </span>
      </div>
      <div className="mt-3 grid gap-2">
        {paletteSurfaces.map((surface) => (
          <PaletteRoleStrip
            key={surface.key}
            label={surface.label}
            roles={variant[surface.key]}
          />
        ))}
      </div>
    </article>
  );
}

const layerExamples: Array<AgentIdentitySigilInput & { label: string }> = [
  {
    label: 'Baseline',
    scope: 'teamleaderleo/scrapbook',
    designation: 'Testing review',
    description: 'Found three actionable test findings.',
  },
  {
    label: 'Repository changed',
    scope: 'teamleaderleo/stensibly',
    designation: 'Testing review',
    description: 'Found three actionable test findings.',
  },
  {
    label: 'Assignment changed',
    scope: 'teamleaderleo/scrapbook',
    designation: 'Testing review',
    description: 'Reviewed release documentation and compatibility notes.',
  },
];

export function AgentSigilLab() {
  return (
    <div className="space-y-5">
      <section className="rounded-[1.4rem] border border-border/70 bg-card/85 p-4 shadow-[0_18px_42px_rgba(28,26,24,0.08)] dark:shadow-[0_18px_42px_rgba(0,0,0,0.24)] sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">
              Current marks
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">
              Place, name, and note each leave a trace
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            The large shape belongs to the place and name. A changing work
            note only nudges the smaller details.
          </p>
        </div>

        <div className="mt-4 grid min-w-0 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {identities.map((identity) => (
            <IdentityCard key={`${identity.scope}:${identity.designation}`} identity={identity} />
          ))}
        </div>
      </section>

      <section
        data-generation-3-palette-shelf
        className="rounded-[1.4rem] border border-border/70 bg-card/85 p-4 shadow-[0_18px_42px_rgba(28,26,24,0.08)] dark:shadow-[0_18px_42px_rgba(0,0,0,0.24)] sm:p-5"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">
              Colour studies
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">
              Pick the atmosphere before redrawing the mark
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            Ten small palettes test quiet, bright, material, and luminous
            moods. The chosen family stays put when the note changes.
          </p>
        </div>

        <div className="mt-4 grid min-w-0 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {generation3PaletteCatalogue.flatMap((family) =>
            family.variants.map((variant) => (
              <Generation3PaletteCard
                key={variant.id}
                family={family}
                variant={variant}
              />
            )),
          )}
        </div>
      </section>

      <section className="grid min-w-0 gap-5 lg:grid-cols-2">
        <div className="rounded-[1.4rem] border border-border/70 bg-card/85 p-4 sm:p-5">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">
            Variations
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">
            Same seed, chosen variation
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            A favourite can be pinned. Trying another variation never quietly
            replaces the one already in use.
          </p>
          <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-8">
            {Array.from({ length: 8 }, (_, variant) => {
              const input = {
                scope: 'openai/codex',
                designation: 'Testing review',
                description: 'Found three actionable test findings.',
                selection: { generation: 2 as const, variant },
              };
              const recipe = createAgentIdentitySigilRecipe(input);
              return (
                <div
                  key={variant}
                  data-sigil-reroll
                  data-sigil-fingerprint={recipe.fingerprint}
                  className="grid min-w-0 place-items-center rounded-xl border border-border/65 bg-background p-2"
                >
                  <AgentIdentitySigil {...input} size={48} />
                  <span className="mt-1 font-mono text-[8px] uppercase tracking-[0.12em] text-muted-foreground">
                    v{variant}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[1.4rem] border border-border/70 bg-card/85 p-4 sm:p-5">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">
            Detail
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">
            More detail, same seed
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Quiet marks stay clear in a list; denser ones can carry more texture
            without becoming a different identity.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2.5">
            {complexityExamples.map((example) => {
              const input = {
                scope: 'teamleaderleo/scrapbook',
                designation: 'Context audit',
                description: 'Checked the model-visible context.',
                selection: { complexity: example.value },
              };
              const recipe = createAgentIdentitySigilRecipe(input);
              return (
                <div
                  key={example.value}
                  className="grid place-items-center rounded-xl border border-border/65 bg-background p-3 text-center"
                >
                  <AgentIdentitySigil {...input} size={68} />
                  <span className="mt-2 text-xs font-medium">{example.label}</span>
                  <span className="mt-1 font-mono text-[8px] uppercase tracking-[0.1em] text-muted-foreground">
                    {recipe.family} · {recipe.elements.length} layers
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid min-w-0 gap-5 lg:grid-cols-2">
        <div className="rounded-[1.4rem] border border-border/70 bg-card/85 p-4 sm:p-5">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">
            Layer isolation
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">
            Different inputs change different regions
          </h2>
          <div className="mt-4 grid grid-cols-3 gap-2.5">
            {layerExamples.map(({ label, ...identity }) => {
              const recipe = createAgentIdentitySigilRecipe(identity);
              return (
                <div
                  key={label}
                  data-sigil-layer-example
                  className="grid place-items-center rounded-xl border border-border/65 bg-background p-3 text-center"
                >
                  <AgentIdentitySigil {...identity} size={68} />
                  <span className="mt-2 text-xs font-medium">{label}</span>
                  <span className="mt-1 font-mono text-[8px] uppercase tracking-[0.08em] text-muted-foreground">
                    {recipe.layerFingerprints.frame.slice(0, 4)} · {recipe.layerFingerprints.glyph.slice(0, 4)} · {recipe.layerFingerprints.accents.slice(0, 4)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[1.4rem] border border-border/70 bg-card/85 p-4 sm:p-5">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">
            Generation history
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">
            Generation 1 remains available beside Generation 2
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            A new generation adds another lineage. It does not mutate a previously selected symbol.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div data-sigil-generation-example className="grid place-items-center rounded-xl border border-border/65 bg-background p-4 text-center">
              <AgentSigil seed="Testing review" size={76} />
              <span className="mt-2 text-xs font-medium">Generation 1</span>
              <span className="mt-1 font-mono text-[8px] uppercase text-muted-foreground">
                flat designation seed
              </span>
            </div>
            <div data-sigil-generation-example className="grid place-items-center rounded-xl border border-border/65 bg-background p-4 text-center">
              <AgentIdentitySigil
                scope="openai/codex"
                designation="Testing review"
                description="Found three actionable test findings."
                size={76}
              />
              <span className="mt-2 text-xs font-medium">Generation 2</span>
              <span className="mt-1 font-mono text-[8px] uppercase text-muted-foreground">
                layered identity seeds
              </span>
            </div>
          </div>
        </div>
      </section>

      <section
        data-sigil-small-sizes
        className="rounded-[1.4rem] border border-border/70 bg-card/85 p-4 sm:p-5"
      >
        <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">
          Small-size check
        </p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              The layered silhouette must survive the list view
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              The 24 and 32 pixel renders matter more than the large showcase. A symbol that only works at poster size is not an agent identity.
            </p>
          </div>
          <div className="flex items-end gap-4 rounded-xl border border-border/65 bg-background px-4 py-3">
            {[24, 32, 48, 72].map((size) => (
              <div key={size} className="grid place-items-center gap-1">
                <AgentIdentitySigil
                  scope="openai/codex"
                  designation="Breaking changes"
                  description="Reviewed compatibility changes."
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
