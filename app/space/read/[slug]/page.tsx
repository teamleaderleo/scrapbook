import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { CodeDisplay } from '@/components/space/code-display';
import { MarkdownContent } from '@/components/space/markdown-content';
import { ReadingPracticeDock } from '@/components/space/reading-practice-dock';
import { PageCurl, StitchedRule } from '@/components/cozy-flourishes';
import { resolveSpaceLane } from '@/lib/space-lanes';
import {
  buildSpaceNextMove,
  buildSpaceTypingTarget,
  parseSpaceNextMoveStage,
  parseSpacePracticeMode,
} from '@/lib/space-practice';
import { displaySpaceTags } from '@/lib/space-tags';
import { loadReadingSheet } from '../data';

type ReadingSheetPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    lane?: string;
    tags?: string;
    from?: string;
    return?: string;
    practice?: string;
    stage?: string;
  }>;
};

function sectionId(label: string, index: number) {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `section-${slug || index + 1}`;
}

function formatUpdatedAt(value: number) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(value);
}

function withoutRepeatedLeadingHeading(html: string, label: string) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.replace(
    new RegExp(
      `^\\s*<h([1-6])(?:\\s[^>]*)?>\\s*${escapedLabel}\\s*</h\\1>`,
      'i'
    ),
    ''
  );
}

export async function generateMetadata({
  params,
}: ReadingSheetPageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = await loadReadingSheet(slug);

  if (!item) return { title: 'Reading sheet not found' };

  const defaultVersion = item.versions[item.defaultIndex] ?? item.versions[0];
  const description = defaultVersion?.content
    .replace(/[#*_`>\[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 155);

  return {
    title: `${item.title} · Space`,
    description: description || `A public learning note about ${item.title}.`,
  };
}

export default async function ReadingSheetPage({
  params,
  searchParams,
}: ReadingSheetPageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const item = await loadReadingSheet(slug);
  if (!item) notFound();

  const lane = resolveSpaceLane(query.lane ?? null, {
    hasQuery: Boolean(query.tags),
  });
  const backQuery = new URLSearchParams({ lane });
  if (query.tags?.trim()) backQuery.set('tags', query.tags.trim());
  const fromTrail = query.from === 'trail';
  const backHref = fromTrail
    ? `/space/trail${
        query.return?.trim()
          ? `#trail-${encodeURIComponent(query.return.trim())}`
          : ''
      }`
    : `/space?${backQuery.toString()}`;
  const versions = item.versions.map((version, index) => ({
    ...version,
    id: sectionId(version.label, index),
  }));
  const primary = versions[item.defaultIndex] ?? versions[0];
  const rest = versions.filter(version => version !== primary);
  const orderedVersions = primary ? [primary, ...rest] : [];
  const requestedPracticeMode = parseSpacePracticeMode(query.practice);
  const nextMoveStage = parseSpaceNextMoveStage(query.stage);
  const suggestedMove = requestedPracticeMode
    ? buildSpaceNextMove(item, {
        familiar: nextMoveStage !== undefined,
        learned: nextMoveStage === 'learned',
      })
    : undefined;
  const typingTarget = buildSpaceTypingTarget(item);

  return (
    <main className="min-h-screen bg-background px-3 py-3 text-foreground sm:px-6 sm:py-6">
      <div className="mx-auto grid w-full max-w-6xl gap-4 lg:grid-cols-[13rem_minmax(0,46rem)] lg:justify-center lg:gap-8">
        <aside className="lg:sticky lg:top-6 lg:h-fit">
          <Link
            href={backHref}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-border/70 bg-background/80 px-4 text-sm font-medium backdrop-blur transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to {fromTrail ? 'trail' : lane}
          </Link>

          {orderedVersions.length > 1 ? (
            <nav
              aria-label="Reading sheet sections"
              className="mt-3 flex snap-x gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible"
            >
              {orderedVersions.map((version, index) => (
                <a
                  key={version.id}
                  href={`#${version.id}`}
                  className="min-h-[44px] shrink-0 snap-start rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-foreground/25 hover:text-foreground lg:flex lg:items-center"
                >
                  <span className="mr-2 font-mono text-[9px] tabular-nums opacity-55">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {version.label}
                </a>
              ))}
            </nav>
          ) : null}
        </aside>

        <article className="material-paper relative min-w-0 overflow-hidden rounded-2xl border shadow-[0_20px_55px_rgba(38,33,27,0.12)] dark:shadow-[0_20px_55px_rgba(0,0,0,0.34)]">
          <header className="px-5 pb-5 pt-6 sm:px-9 sm:pb-7 sm:pt-9">
            <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[hsl(var(--material-paper-ink)/0.58)]">
              <span>{item.category}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={new Date(item.updatedAt).toISOString()}>
                {formatUpdatedAt(item.updatedAt)}
              </time>
            </div>

            <h1 className="mt-4 max-w-[24ch] text-balance text-3xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl">
              {item.title}
            </h1>

            <div className="mt-5 flex flex-wrap gap-1.5">
              {displaySpaceTags(item.tags).map((tag, index) => (
                <span
                  key={`${tag}-${index}`}
                  className="rounded-full border border-[hsl(var(--material-paper-edge)/0.7)] bg-[hsl(var(--material-paper-face)/0.55)] px-2.5 py-1 text-[10px] leading-4 text-[hsl(var(--material-paper-ink)/0.68)]"
                >
                  {tag}
                </span>
              ))}
            </div>

            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[hsl(var(--material-paper-edge)/0.72)] px-3 text-sm font-medium underline-offset-4 transition-colors hover:bg-black/5 hover:underline dark:hover:bg-white/5"
              >
                Open pinned source
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
            ) : null}
          </header>

          <StitchedRule className="mx-5 sm:mx-9" />

          <div className="divide-y divide-dashed divide-[hsl(var(--material-paper-edge)/0.65)]">
            {orderedVersions.map((version, index) => (
              <section
                key={version.id}
                id={version.id}
                className="scroll-mt-6 px-5 py-7 sm:px-9 sm:py-9"
              >
                <div className="mb-5 flex items-baseline justify-between gap-4">
                  <h2 className="text-xl font-semibold tracking-[-0.025em] sm:text-2xl">
                    {version.label}
                  </h2>
                  <span className="font-mono text-[10px] tabular-nums text-[hsl(var(--material-paper-ink)/0.45)]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>

                <MarkdownContent
                  html={withoutRepeatedLeadingHeading(
                    version.contentHtml,
                    version.label
                  )}
                  className="prose prose-stone max-w-[68ch] prose-headings:scroll-mt-6 prose-headings:tracking-[-0.025em] prose-p:leading-7 prose-li:leading-7 prose-a:font-medium prose-a:underline-offset-4 [&_code]:[overflow-wrap:anywhere] dark:prose-invert sm:prose-base"
                />

                {version.code ? (
                  <CodeDisplay
                    code={version.code}
                    codeHtml={version.codeHtml}
                    title={`${version.label} code`}
                    className="mt-6"
                  />
                ) : null}
              </section>
            ))}
          </div>

          <ReadingPracticeDock
            key={`${item.slug}:${requestedPracticeMode ?? 'question'}`}
            slug={item.slug}
            title={item.title}
            sourceUrl={item.url}
            initialMode={requestedPracticeMode}
            promptOverride={
              suggestedMove?.mode === requestedPracticeMode
                ? suggestedMove?.prompt
                : undefined
            }
            typingTarget={typingTarget}
          />

          <PageCurl className="h-10 w-10 opacity-70 [&>span]:h-10 [&>span]:w-10" />
          <span className="material-paper-edge" aria-hidden="true" />
        </article>
      </div>
    </main>
  );
}
