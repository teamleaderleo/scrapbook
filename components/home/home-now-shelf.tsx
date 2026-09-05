import { CensorReveal } from '@/components/ui/censor-reveal';
import { botDeskEntries } from '@/lib/bot-desk';
import { getBotDeskDisplayCopy } from '@/lib/bot-desk-display';
import { publicLearningRecords } from '@/lib/learning-records';
import { getKnowledgeIndex } from '@/lib/knowledge';
import { workRecordUpdatedAt, workRecords } from '@/lib/work-records';
import Link from 'next/link';

export async function HomeNowShelf() {
  const index = await getKnowledgeIndex();
  const workbench = botDeskEntries.find(
    entry => entry.publicationState === 'Published'
  );
  const learning = [...publicLearningRecords].sort((a, b) =>
    (b.revisions.at(-1)?.createdAt ?? '').localeCompare(
      a.revisions.at(-1)?.createdAt ?? ''
    )
  )[0];
  const concept = [...index.concepts].sort(
    (a, b) =>
      (b.updated ?? b.created ?? '').localeCompare(
        a.updated ?? a.created ?? ''
      ) || (b.created ?? '').localeCompare(a.created ?? '')
  )[0];
  const items = [
    ...(workbench
      ? [
          {
            href: `/desk/${workbench.slug}`,
            title: getBotDeskDisplayCopy(workbench).title,
            note: getBotDeskDisplayCopy(workbench).blurb,
            kind: 'Writing',
            date: workbench.date,
          },
        ]
      : []),
    ...(learning
      ? [
          {
            href: learning.canonicalUrl,
            title: learning.title,
            note: learning.spark,
            kind: 'Study',
            date: learning.revisions.at(-1)?.createdAt.slice(0, 10) ?? '',
          },
        ]
      : []),
    ...(concept
      ? [
          {
            href: `/knowledge/${concept.slug}`,
            title: concept.title,
            note: concept.summary ?? '',
            kind: 'Knowledge',
            date: concept.updated ?? concept.created ?? '',
          },
        ]
      : []),
    {
      href: '/work',
      title: 'Engineering work',
      note: `${workRecords[0].title}: ${workRecords[0].status}`,
      kind: 'Work record',
      date: workRecordUpdatedAt,
    },
  ].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <section
      aria-labelledby="home-now-title"
      className="min-w-0"
      data-home-now-shelf
    >
      <h2
        id="home-now-title"
        className="border-b border-border pb-3 text-base font-semibold"
      >
        Latest changes
      </h2>
      <ul className="divide-y divide-border/60">
        {items.map(item => (
          <li key={item.href}>
            <Link
              href={item.href}
              prefetch={false}
              data-home-now-kind={item.kind}
              className="grid gap-1 py-3 hover:bg-muted/40 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-5"
            >
              <span className="text-xs leading-5 text-muted-foreground">
                {item.kind}
                <time
                  dateTime={item.date}
                  className="ml-3 tabular-nums sm:ml-0 sm:block"
                >
                  {item.date}
                </time>
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">
                  <CensorReveal text={item.title} />
                </span>
                <span
                  className="mt-1 overflow-hidden text-xs leading-5 text-muted-foreground"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  <CensorReveal text={item.note} />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
