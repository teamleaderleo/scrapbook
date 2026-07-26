import 'server-only';

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type { BlogPost } from '@/app/lib/definitions/blog';
import {
  buildRedline,
  type EditorialComment,
  type RedlineRow,
} from '@/lib/editorial-diff';

const EDITORIAL_ROOT = path.join(process.cwd(), 'content/editorial');

export type EditorialVersion = {
  revision: number;
  label: string;
  content: string;
  latest: boolean;
};

export type EditorialRevisionBundle = {
  versions: EditorialVersion[];
  redline: RedlineRow[];
  comments: EditorialComment[];
  fromRevision: number | null;
  toRevision: number;
};

type EditorialManifest = {
  comments?: EditorialComment[];
};

function readManifest(directory: string): EditorialManifest {
  const manifestPath = path.join(directory, 'revisions.json');
  if (!fs.existsSync(manifestPath)) return {};

  const parsed = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as EditorialManifest;
  return {
    comments: Array.isArray(parsed.comments) ? parsed.comments : [],
  };
}

function readSnapshots(directory: string): EditorialVersion[] {
  if (!fs.existsSync(directory)) return [];

  return fs
    .readdirSync(directory)
    .map((fileName) => ({ fileName, match: /^v(\d+)-.*\.mdx?$/.exec(fileName) }))
    .filter(
      (entry): entry is { fileName: string; match: RegExpExecArray } => Boolean(entry.match),
    )
    .map(({ fileName, match }) => {
      const fileContents = fs.readFileSync(path.join(directory, fileName), 'utf8');
      const { data, content } = matter(fileContents);
      const revision = Number(match[1]);
      const descriptor = data.editorialStatus
        ? String(data.editorialStatus).replaceAll('-', ' ')
        : 'stored snapshot';

      return {
        revision,
        label: `Revision ${revision} · ${descriptor}`,
        content,
        latest: false,
      };
    });
}

export function getEditorialRevisions(post: BlogPost): EditorialRevisionBundle {
  const currentRevision = post.revision ?? 1;
  const directory = path.join(EDITORIAL_ROOT, post.slug);
  const manifest = readManifest(directory);
  const comments = manifest.comments ?? [];
  const versions = readSnapshots(directory)
    .filter((version) => version.revision !== currentRevision)
    .concat({
      revision: currentRevision,
      label: `Revision ${currentRevision} · latest`,
      content: post.content,
      latest: true,
    })
    .sort((a, b) => a.revision - b.revision);

  const latest = versions.at(-1)!;
  const previous = versions.at(-2);

  return {
    versions,
    comments,
    redline: previous ? buildRedline(previous.content, latest.content, comments) : [],
    fromRevision: previous?.revision ?? null,
    toRevision: latest.revision,
  };
}
