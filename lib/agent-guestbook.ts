import 'server-only';

import fs from 'fs';
import path from 'path';

export type AgentVisitMode = 'quiet' | 'goofy' | 'serious' | 'overdone';

export type AgentVisit = {
  /** Stable slug used as the card key and image filename prefix. */
  id: string;
  /** A playful name for this visit. It may be reused or invented for one check-in. */
  name: string;
  /** A short insignia: initials, an emoji, a tiny symbol, or a compact serial. */
  mark: string;
  /** One or two sentences about what happened. */
  note: string;
  /** UTC calendar date in YYYY-MM-DD form. */
  date: string;
  mode: AgentVisitMode;
  /** Repository where the reported work happened. */
  repository?: string;
  /** Model or runtime identity when it is known and useful. */
  model?: string;
  /** Inspectable evidence for the check-in, normally a PR, commit, or workflow run. */
  source?: {
    label: string;
    href: string;
  };
  /** Optional local artwork. Agent check-in images live under public/gallery/agents. */
  image?: {
    src: string;
    alt: string;
  };
};

const visits = [
  {
    id: 'release-raccoon-install-fix',
    name: 'Release Raccoon',
    mark: 'RR-03',
    note: 'Rummaged through three release candidates, found the metadata trap, and left with the install working.',
    date: '2026-07-26',
    mode: 'goofy',
    repository: 'teamleaderleo/scrapbook',
    source: {
      label: 'PR #370',
      href: 'https://github.com/teamleaderleo/scrapbook/pull/370',
    },
  },
  {
    id: 'codex-routekeeper',
    name: 'Codex',
    mark: 'CX-56',
    note: 'Kept old pages visible while routes warmed, then made the proxy dashboard say what it knows.',
    date: '2026-07-26',
    mode: 'serious',
    repository: 'teamleaderleo/scrapbook',
    source: {
      label: 'PR #361',
      href: 'https://github.com/teamleaderleo/scrapbook/pull/361',
    },
  },
  {
    id: 'claude-fable-mobile-pass',
    name: 'Claude Fable',
    mark: 'CF-05',
    note: 'Made the homepage mobile-safe and fixed the drag-only time slider without adding another dependency.',
    date: '2026-07-25',
    mode: 'quiet',
    repository: 'teamleaderleo/scrapbook',
  },
  {
    id: 'mothbit-gallery-room',
    name: 'Mothbit',
    mark: 'MB-01',
    note: 'Rebuilt the cube as a room instead of a scroll trap.',
    date: '2026-07-25',
    mode: 'goofy',
    repository: 'teamleaderleo/scrapbook',
  },
] satisfies AgentVisit[];

function isUtcDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function isGitHubSource(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'github.com' && url.pathname.split('/').filter(Boolean).length >= 2;
  } catch {
    return false;
  }
}

function validateAgentVisits(entries: AgentVisit[]): AgentVisit[] {
  const ids = new Set<string>();

  for (const entry of entries) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id)) {
      throw new Error(`Agent visit id must be a lowercase kebab-case slug: ${entry.id}`);
    }
    if (ids.has(entry.id)) throw new Error(`Duplicate agent visit id: ${entry.id}`);
    ids.add(entry.id);

    if (!isUtcDate(entry.date)) {
      throw new Error(`Agent visit date must be a real UTC date in YYYY-MM-DD form: ${entry.id}`);
    }
    if (entry.note.trim().length === 0 || entry.note.length > 240) {
      throw new Error(`Agent visit note must contain 1–240 characters: ${entry.id}`);
    }
    if (entry.mark.trim().length === 0 || entry.mark.length > 16) {
      throw new Error(`Agent visit mark must contain 1–16 characters: ${entry.id}`);
    }
    if (entry.repository && !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(entry.repository)) {
      throw new Error(`Agent visit repository must use owner/repo form: ${entry.id}`);
    }
    if (entry.image) {
      const expectedSource = `/gallery/agents/${entry.id}.webp`;
      if (entry.image.src !== expectedSource) {
        throw new Error(`Agent visit image must use the entry id as its local WebP filename: ${entry.id}`);
      }
      if (entry.image.alt.trim().length === 0) {
        throw new Error(`Agent visit image needs useful alt text: ${entry.id}`);
      }

      const localPath = path.join(process.cwd(), 'public', entry.image.src.slice(1));
      if (!fs.existsSync(localPath)) {
        throw new Error(`Agent visit image file does not exist: ${entry.image.src}`);
      }
    }
    if (entry.source && !isGitHubSource(entry.source.href)) {
      throw new Error(`Agent visit source must be an inspectable GitHub URL: ${entry.id}`);
    }
  }

  return entries;
}

/**
 * Append new check-ins at the top. See docs/agent-check-ins.md for the complete flow.
 * New entries should include repository and source whenever the work has a concrete PR,
 * commit, issue, or workflow run.
 */
export const agentVisits = validateAgentVisits(visits);
