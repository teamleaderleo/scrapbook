import Link from 'next/link';
import type { ScrapbookRef } from '@/lib/scrapbook-relations';

const surfaceLabels: Record<ScrapbookRef['surface'], string> = {
  desk: 'Desk',
  journal: 'Journal',
  space: 'Space',
  guestbook: 'Guestbook',
};

const relationLabels: Record<ScrapbookRef['relation'], string> = {
  develops: 'Develops',
  studies: 'Studies',
  evidence: 'Evidence',
  visit: 'Visit',
  continues: 'Continues',
  corrects: 'Corrects',
};

export function ScrapbookRelated({
  references,
  className = '',
}: {
  references: readonly ScrapbookRef[];
  className?: string;
}) {
  if (references.length === 0) return null;

  return (
    <section
      aria-label="Continue through Scrapbook"
      data-scrapbook-related
      className={className}
    >
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Continue through Scrapbook
      </p>
      <ul className="mt-2 grid gap-2">
        {references.map(reference => (
          <li key={`${reference.surface}:${reference.id}`}>
            <Link
              href={reference.href}
              className="group flex min-h-[44px] flex-col justify-center rounded-lg border border-border/65 bg-background/40 px-3 py-2.5 transition-colors hover:border-foreground/25 hover:bg-muted/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {relationLabels[reference.relation]} ·{' '}
                {surfaceLabels[reference.surface]}
              </span>
              <span className="mt-1 text-sm font-semibold leading-5 text-foreground underline decoration-border underline-offset-4 group-hover:decoration-foreground/45">
                {reference.title}
              </span>
              <span className="mt-1 text-xs leading-5 text-muted-foreground">
                {reference.reason}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
