import Link from 'next/link';
import SiteNav from '@/components/site-nav';

const experiments = [
  {
    href: '/atelier',
    title: 'Atelier',
    eyebrow: 'open sketch',
    description: 'Lavender cube, weapon-wheel navigation, and personal interface experiments before they touch the main site.',
  },
  {
    title: 'Vault',
    eyebrow: 'planned',
    description: 'Private art/reference archive with tags, source attribution, dedupe, and AI-assisted organization.',
  },
  {
    title: 'Reader',
    eyebrow: 'planned',
    description: 'Fast PDF / Markdown reading surface tuned for highlights, side notes, and reference extraction.',
  },
] as const;

export default function LabPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(184,181,255,0.18),_transparent_34rem)] text-foreground">
      <SiteNav />
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">Lab</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Experimental shelf</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
            Small personal-site sketches live here first: game UI, dashboard objects, reference systems, reader surfaces, and whatever weird interface ideas need a place to breathe.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {experiments.map((item) => {
            const card = (
              <article className="group h-full rounded-3xl border bg-background/80 p-5 shadow-sm backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-[#b8b5ff]/60 hover:bg-[#b8b5ff]/10 hover:shadow-[0_0_30px_rgba(184,181,255,0.16)]">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full border border-[#b8b5ff]/35 bg-[#b8b5ff]/10 px-2.5 py-1 text-[11px] font-medium text-muted-foreground group-hover:text-foreground">
                    {item.eyebrow}
                  </span>
                  {'href' in item ? <span className="text-xs text-muted-foreground group-hover:text-foreground">enter →</span> : null}
                </div>
                <h2 className="mt-5 text-2xl font-semibold tracking-tight">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
              </article>
            );

            if ('href' in item) {
              return (
                <Link key={item.title} href={item.href} className="block h-full focus:outline-none focus:ring-2 focus:ring-[#cbc8ff]/60">
                  {card}
                </Link>
              );
            }

            return <div key={item.title}>{card}</div>;
          })}
        </div>

        <div className="mt-6 rounded-3xl border bg-background/70 p-5 text-sm leading-6 text-muted-foreground shadow-sm backdrop-blur">
          The rule: keep experiments here until they earn a permanent route. The homepage, proxy dashboard, and existing pages stay stable while the lab gets weird.
        </div>
      </section>
    </main>
  );
}
