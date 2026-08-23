import { CensorReveal } from '@/components/ui/censor-reveal';
import { agentVisits } from '@/lib/agent-guestbook';
import { botDeskEntries } from '@/lib/bot-desk';
import { publicLearningRecords } from '@/lib/learning-records';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

function latestLearningRecord() {
  return [...publicLearningRecords].sort((left, right) => {
    const leftDate = left.revisions.at(-1)?.createdAt ?? '';
    const rightDate = right.revisions.at(-1)?.createdAt ?? '';
    return rightDate.localeCompare(leftDate);
  })[0];
}

export function HomeNowShelf() {
  const workbench = botDeskEntries.find(entry => entry.publicationState === 'Published');
  const learning = latestLearningRecord();
  const visit = agentVisits[0];

  const items = [
    workbench
      ? {
          id: `workbench-${workbench.slug}`,
          kind: 'latest writing',
          title: workbench.title,
          note: workbench.blurb,
          href: `/desk/${workbench.slug}`,
          censor: true,
        }
      : null,
    learning
      ? {
          id: `learning-${learning.slug}`,
          kind: 'studying',
          title: learning.title,
          note: learning.spark,
          href: learning.canonicalUrl,
          censor: false,
        }
      : null,
    visit
      ? {
          id: `visit-${visit.id}`,
          kind: 'agent visit',
          title: visit.name,
          note: visit.note,
          href: `/gallery#visit-${visit.id}`,
          censor: false,
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  if (items.length === 0) return null;

  return (
    <section aria-labelledby="home-now-title" className="min-w-0" data-home-now-shelf>
      <div className="mb-2 px-0.5">
        <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">
          Now
        </p>
        <h2 id="home-now-title" className="mt-1 text-base font-semibold tracking-tight">
          On the desk
        </h2>
      </div>

      <div className="grid min-w-0 overflow-hidden rounded-xl border border-border/65 bg-card/70 sm:grid-cols-3">
        {items.map((item, index) => (
          <Link
            key={item.id}
            href={item.href}
            data-home-now-kind={item.kind}
            className="group flex min-h-24 min-w-0 flex-col justify-between gap-3 border-border/55 px-3.5 py-3 transition-colors hover:bg-muted/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [&:nth-child(n+2)]:border-t sm:[&:nth-child(n+2)]:border-l sm:[&:nth-child(n+2)]:border-t-0"
          >
            <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {item.kind}
            </span>
            <span className="flex min-w-0 items-end justify-between gap-3">
              <span className="min-w-0">
                <span className="block line-clamp-1 text-sm font-semibold tracking-tight">
                  {item.censor ? <CensorReveal text={item.title} /> : item.title}
                </span>
                <span className="mt-1 block line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {item.censor ? <CensorReveal text={item.note} /> : item.note}
                </span>
              </span>
              <ArrowRight
                className="mb-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                aria-hidden="true"
              />
            </span>
            <span className="sr-only">Item {index + 1} of {items.length}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
