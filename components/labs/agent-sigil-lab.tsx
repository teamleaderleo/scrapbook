import AgentSigil from '@/components/agent-sigil';
import { createAgentSigilRecipe, type AgentSigilComplexity } from '@/lib/agent-sigils';

const identitySeeds = [
  'Testing review',
  'Change size',
  'Context review',
  'Breaking changes',
  'Testing audit',
  'Breaking Changes final',
  'Context audit',
  'Size review',
  'Agent 1 coordination',
  'Agent 2 behaviour review',
  'Agent 3 regression audit',
  'Agent 4 visual review',
  'Agent 5 integration',
  'Thread Compass',
  'Fifth Drawer',
  'Release Raccoon',
  'Codex Routekeeper',
  'Mothbit Gallery Room',
] as const;

const complexityExamples: Array<{ label: string; value: AgentSigilComplexity }> = [
  { label: 'Quiet', value: 'quiet' },
  { label: 'Regular', value: 'regular' },
  { label: 'Dense', value: 'dense' },
];

function IdentityCard({ seed }: { seed: string }) {
  const recipe = createAgentSigilRecipe({ seed });

  return (
    <article
      data-sigil-card
      data-sigil-seed={seed}
      data-sigil-fingerprint={recipe.fingerprint}
      className="flex min-w-0 items-center gap-3 rounded-[1.1rem] border border-border/70 bg-card p-3.5 shadow-[0_12px_28px_rgba(28,26,24,0.07)] dark:shadow-[0_12px_28px_rgba(0,0,0,0.2)]"
    >
      <div className="grid size-[4.5rem] shrink-0 place-items-center rounded-[1rem] border border-border/60 bg-background">
        <AgentSigil seed={seed} size={60} />
      </div>
      <div className="min-w-0">
        <h3 className="truncate text-sm font-medium">{seed}</h3>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.13em] text-muted-foreground">
          {recipe.family} · {recipe.paletteName}
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/75">
          {recipe.fingerprint} · {recipe.symmetry}-fold
        </p>
      </div>
    </article>
  );
}

export function AgentSigilLab() {
  return (
    <div className="space-y-5">
      <section className="rounded-[1.4rem] border border-border/70 bg-card/85 p-4 shadow-[0_18px_42px_rgba(28,26,24,0.08)] dark:shadow-[0_18px_42px_rgba(0,0,0,0.24)] sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">
              Stable identity set
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">One seed, one repeatable sigil</h2>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            These are generated from names only. Reloading, server rendering, and SVG export reproduce the same recipes without storing image files.
          </p>
        </div>

        <div className="mt-4 grid min-w-0 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {identitySeeds.map((seed) => (
            <IdentityCard key={seed} seed={seed} />
          ))}
        </div>
      </section>

      <section className="grid min-w-0 gap-5 lg:grid-cols-2">
        <div className="rounded-[1.4rem] border border-border/70 bg-card/85 p-4 sm:p-5">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">
            Explicit rerolls
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">Same identity, deliberate nonce</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            A reroll is visible and reproducible. Changing the nonce creates another recipe without pretending the original never existed.
          </p>
          <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-8">
            {Array.from({ length: 8 }, (_, nonce) => {
              const recipe = createAgentSigilRecipe({ seed: 'Testing review', nonce });
              return (
                <div
                  key={nonce}
                  data-sigil-reroll
                  data-sigil-fingerprint={recipe.fingerprint}
                  className="grid min-w-0 place-items-center rounded-xl border border-border/65 bg-background p-2"
                >
                  <AgentSigil seed="Testing review" nonce={nonce} size={48} />
                  <span className="mt-1 font-mono text-[8px] uppercase tracking-[0.12em] text-muted-foreground">
                    n{nonce}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[1.4rem] border border-border/70 bg-card/85 p-4 sm:p-5">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">
            Complexity grammar
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">Density changes the recipe, not the identity model</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Quiet marks remain legible in dense lists. Regular and dense modes add symmetry and internal layers for larger surfaces.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2.5">
            {complexityExamples.map((example) => {
              const recipe = createAgentSigilRecipe({
                seed: 'Context audit',
                complexity: example.value,
              });
              return (
                <div
                  key={example.value}
                  className="grid place-items-center rounded-xl border border-border/65 bg-background p-3 text-center"
                >
                  <AgentSigil seed="Context audit" complexity={example.value} size={68} />
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

      <section
        data-sigil-small-sizes
        className="rounded-[1.4rem] border border-border/70 bg-card/85 p-4 sm:p-5"
      >
        <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">
          Small-size check
        </p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">The silhouette must survive the list view</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              The 24 and 32 pixel renders matter more than the large showcase. A symbol that only works at poster size is not an agent identity.
            </p>
          </div>
          <div className="flex items-end gap-4 rounded-xl border border-border/65 bg-background px-4 py-3">
            {[24, 32, 48, 72].map((size) => (
              <div key={size} className="grid place-items-center gap-1">
                <AgentSigil seed="Breaking changes" size={size} />
                <span className="font-mono text-[8px] text-muted-foreground">{size}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
