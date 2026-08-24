import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import ViewportPageShell from '@/components/viewport-page-shell';
import { MarkdownContent } from '@/components/space/markdown-content';
import { getKnowledgeDocument, getKnowledgeIndex } from '@/lib/knowledge';

type KnowledgeDocumentPageProps = {
  params: Promise<{ slug: string[] }>;
};

export async function generateStaticParams() {
  const index = await getKnowledgeIndex();
  return [...index.trunks, ...index.concepts, ...index.logs].map(entry => ({
    slug: entry.slug.split('/'),
  }));
}

export async function generateMetadata({
  params,
}: KnowledgeDocumentPageProps): Promise<Metadata> {
  const { slug } = await params;
  const document = await getKnowledgeDocument(slug);
  if (!document) return { title: 'Knowledge node not found' };

  return {
    title: `${document.title} · Knowledge`,
    description: document.summary,
    alternates: { canonical: `/knowledge/${document.slug}` },
  };
}

export default async function KnowledgeDocumentPage({
  params,
}: KnowledgeDocumentPageProps) {
  const { slug } = await params;
  const document = await getKnowledgeDocument(slug);
  if (!document) notFound();

  const index = await getKnowledgeIndex();
  const trunk = document.trunk
    ? index.trunks.find(candidate => candidate.trunk === document.trunk)
    : undefined;
  const childNodes =
    document.kind === 'trunk'
      ? index.concepts.filter(concept => concept.trunk === document.trunk)
      : [];

  return (
    <ViewportPageShell
      className="bg-background text-foreground"
      contentClassName="min-h-[calc(100dvh-3rem)]"
    >
      <main className="mx-auto w-full max-w-6xl px-3 pb-24 pt-4 sm:px-6 sm:pt-7">
        <nav
          className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"
          aria-label="Knowledge breadcrumb"
        >
          <Link
            href="/knowledge"
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 font-medium hover:bg-card hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Knowledge
          </Link>
          {document.kind === 'concept' && trunk ? (
            <>
              <span aria-hidden="true">/</span>
              <Link
                href={`/knowledge/${trunk.slug}`}
                className="font-medium underline decoration-border underline-offset-4 hover:text-foreground"
              >
                {trunk.title}
              </Link>
            </>
          ) : null}
        </nav>

        <article className="material-paper relative overflow-hidden rounded-2xl border shadow-[0_20px_55px_rgba(38,33,27,0.12)] dark:shadow-[0_20px_55px_rgba(0,0,0,0.34)]">
          <header className="border-b border-dashed border-[hsl(var(--material-paper-edge)/0.7)] px-5 pb-6 pt-7 sm:px-9 sm:pb-8 sm:pt-10">
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-[hsl(var(--material-paper-ink)/0.52)]">
              {document.kind === 'log'
                ? 'Learning log'
                : document.kind === 'trunk'
                  ? 'Knowledge trunk'
                  : trunk?.title ?? 'Knowledge node'}
            </p>
            <h1 className="mt-3 max-w-[24ch] text-balance text-3xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl">
              {document.title}
            </h1>
            {document.summary ? (
              <p className="mt-5 max-w-[68ch] text-base font-medium leading-7 text-[hsl(var(--material-paper-ink)/0.7)] sm:text-lg">
                {document.summary}
              </p>
            ) : null}
            <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.11em] text-[hsl(var(--material-paper-ink)/0.42)]">
              {document.updated
                ? `updated ${document.updated}`
                : document.date ?? document.sourcePath}
            </p>
          </header>

          <div className="px-5 py-7 sm:px-9 sm:py-10">
            <MarkdownContent
              html={document.html}
              className="prose prose-stone max-w-[68ch] prose-headings:scroll-mt-6 prose-headings:tracking-[-0.025em] prose-p:leading-7 prose-li:leading-7 prose-a:font-medium prose-a:underline-offset-4 dark:prose-invert sm:prose-base"
            />
          </div>

          {childNodes.length > 0 ? (
            <section
              className="border-t border-dashed border-[hsl(var(--material-paper-edge)/0.7)] px-5 py-7 sm:px-9 sm:py-9"
              aria-labelledby="knowledge-trunk-nodes"
            >
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-[hsl(var(--material-paper-ink)/0.5)]">
                Local nodes
              </p>
              <h2
                id="knowledge-trunk-nodes"
                className="mt-2 text-xl font-semibold tracking-[-0.025em]"
              >
                Continue through this trunk
              </h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {childNodes.map(node => (
                  <li key={node.slug}>
                    <Link
                      href={`/knowledge/${node.slug}`}
                      className="group flex min-h-12 items-center justify-between gap-3 rounded-xl border border-[hsl(var(--material-paper-edge)/0.65)] bg-[hsl(var(--material-paper-face)/0.4)] px-3 py-2 text-sm font-medium hover:bg-[hsl(var(--material-paper-face)/0.7)]"
                    >
                      <span>{node.title}</span>
                      <ArrowRight
                        className="h-3.5 w-3.5 shrink-0 opacity-55 transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </article>
      </main>
    </ViewportPageShell>
  );
}
