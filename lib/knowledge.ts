import matter from 'gray-matter';
import fs from 'node:fs/promises';
import path from 'node:path';
import { parseMarkdown } from '@/app/lib/utils/markdown';

export type KnowledgeKind = 'trunk' | 'concept' | 'log';

export type KnowledgeEntry = {
  slug: string;
  title: string;
  kind: KnowledgeKind;
  trunk?: string;
  summary?: string;
  created?: string;
  updated?: string;
  date?: string;
  newCount?: number;
  strengthenedCount?: number;
  linkedCount?: number;
  sourcePath: string;
};

export type KnowledgeTrunk = KnowledgeEntry & {
  kind: 'trunk';
  nodes: KnowledgeEntry[];
};

export type KnowledgeIndex = {
  trunks: KnowledgeTrunk[];
  concepts: KnowledgeEntry[];
  logs: KnowledgeEntry[];
};

export type KnowledgeDocument = KnowledgeEntry & {
  html: string;
  markdown: string;
};

const KNOWLEDGE_ROOT = path.join(process.cwd(), 'knowledge');
const SKIP_FILES = new Set(['AGENTS.md']);

function asString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function asNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function inferKind(sourcePath: string, rawKind: unknown): KnowledgeKind {
  if (rawKind === 'trunk' || rawKind === 'concept' || rawKind === 'log') {
    return rawKind;
  }
  if (sourcePath.startsWith('log/')) return 'log';
  if (sourcePath.endsWith('/README.md')) return 'trunk';
  return 'concept';
}

export function knowledgeSlugFromSourcePath(sourcePath: string) {
  const normalized = sourcePath.replaceAll('\\', '/');
  if (normalized.endsWith('/README.md')) {
    return normalized.slice(0, -'/README.md'.length);
  }
  return normalized.replace(/\.md$/i, '');
}

export function resolveKnowledgeLink(sourcePath: string, href: string) {
  if (
    !href ||
    href.startsWith('#') ||
    href.startsWith('/') ||
    /^[a-z][a-z0-9+.-]*:/i.test(href)
  ) {
    return href;
  }

  const hashIndex = href.indexOf('#');
  const rawPath = hashIndex === -1 ? href : href.slice(0, hashIndex);
  const hash = hashIndex === -1 ? '' : href.slice(hashIndex);
  if (!rawPath.toLowerCase().endsWith('.md')) return href;

  const baseDirectory = path.posix.dirname(sourcePath.replaceAll('\\', '/'));
  const resolved = path.posix.normalize(path.posix.join(baseDirectory, rawPath));
  if (resolved === '..' || resolved.startsWith('../')) return href;

  const slug = knowledgeSlugFromSourcePath(resolved);
  return `/knowledge${slug ? `/${slug}` : ''}${hash}`;
}

export function rewriteKnowledgeLinks(markdown: string, sourcePath: string) {
  return markdown.replace(
    /\]\(([^)\s]+\.md(?:#[^)]*)?)\)/g,
    (match, href: string) => `](${resolveKnowledgeLink(sourcePath, href)})`
  );
}

async function walk(directory: string, prefix = ''): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...(await walk(path.join(directory, entry.name), relativePath)));
      continue;
    }
    files.push(relativePath);
  }

  return files;
}

async function readEntry(sourcePath: string): Promise<KnowledgeEntry> {
  const source = await fs.readFile(path.join(KNOWLEDGE_ROOT, sourcePath), 'utf8');
  const parsed = matter(source);
  const data = parsed.data as Record<string, unknown>;
  const kind = inferKind(sourcePath, data.kind);
  const slug = knowledgeSlugFromSourcePath(sourcePath);
  const fallbackTitle = slug.split('/').at(-1)?.replaceAll('-', ' ') ?? slug;

  return {
    slug,
    title: asString(data.title) ?? fallbackTitle,
    kind,
    trunk: asString(data.trunk),
    summary: asString(data.summary),
    created: asString(data.created),
    updated: asString(data.updated),
    date: asString(data.date),
    newCount: asNumber(data.new),
    strengthenedCount: asNumber(data.strengthened),
    linkedCount: asNumber(data.linked),
    sourcePath,
  };
}

export async function getKnowledgeIndex(): Promise<KnowledgeIndex> {
  const files = (await walk(KNOWLEDGE_ROOT)).filter(
    file =>
      file.endsWith('.md') &&
      file !== 'README.md' &&
      !SKIP_FILES.has(file)
  );
  const entries = await Promise.all(files.map(readEntry));
  const concepts = entries
    .filter(entry => entry.kind === 'concept')
    .sort((left, right) => left.title.localeCompare(right.title));
  const logs = entries
    .filter(entry => entry.kind === 'log')
    .sort((left, right) =>
      (right.date ?? right.title).localeCompare(left.date ?? left.title)
    );
  const trunks = entries
    .filter((entry): entry is KnowledgeEntry & { kind: 'trunk' } =>
      entry.kind === 'trunk'
    )
    .sort((left, right) => left.title.localeCompare(right.title))
    .map(trunk => ({
      ...trunk,
      nodes: concepts.filter(concept => concept.trunk === trunk.trunk),
    }));

  return { trunks, concepts, logs };
}

function safeSlug(parts: readonly string[]) {
  return (
    parts.length > 0 &&
    parts.every(part => /^[a-z0-9][a-z0-9-]*$/i.test(part))
  );
}

async function existingSourcePath(parts: readonly string[]) {
  if (!safeSlug(parts)) return undefined;
  const joined = parts.join('/');
  const candidates = [`${joined}.md`, `${joined}/README.md`];

  for (const candidate of candidates) {
    try {
      const stat = await fs.stat(path.join(KNOWLEDGE_ROOT, candidate));
      if (stat.isFile()) return candidate;
    } catch {
      // Try the next candidate.
    }
  }

  return undefined;
}

export async function getKnowledgeDocument(
  parts: readonly string[]
): Promise<KnowledgeDocument | undefined> {
  const sourcePath = await existingSourcePath(parts);
  if (!sourcePath) return undefined;

  const source = await fs.readFile(path.join(KNOWLEDGE_ROOT, sourcePath), 'utf8');
  const parsed = matter(source);
  const entry = await readEntry(sourcePath);
  const markdown = parsed.content.trim().replace(/^#\s+.+\n+/, '');
  const linkedMarkdown = rewriteKnowledgeLinks(markdown, sourcePath);
  const html = await parseMarkdown(linkedMarkdown);

  return { ...entry, markdown, html };
}
