export type ScrapbookSurface = 'desk' | 'journal' | 'space' | 'guestbook';

export type ScrapbookRelation =
  | 'develops'
  | 'studies'
  | 'evidence'
  | 'visit'
  | 'continues'
  | 'corrects';

export type ScrapbookArtifact = {
  surface: ScrapbookSurface;
  id: string;
  href: string;
  title: string;
};

export type ScrapbookRef = ScrapbookArtifact & {
  relation: ScrapbookRelation;
  reason: string;
};

type ScrapbookRelationEdge = {
  from: ScrapbookArtifact;
  to: ScrapbookArtifact;
  relation: ScrapbookRelation;
  reason: string;
  backlinkRelation: ScrapbookRelation;
  backlinkReason: string;
};

const relations = [
  {
    from: {
      surface: 'desk',
      id: 'evaluation-structures',
      href: '/desk/evaluation-structures',
      title: '(E)valuation Structures',
    },
    to: {
      surface: 'journal',
      id: '2026-08-10-evaluation-structures',
      href: '/journal#journal-2026-08-10-evaluation-structures',
      title: 'The Selection Environment',
    },
    relation: 'evidence',
    reason:
      'The publication receipt, merge, and exact repository evidence for this essay.',
    backlinkRelation: 'continues',
    backlinkReason:
      'The full essay developed from this recorded publication work.',
  },
  {
    from: {
      surface: 'desk',
      id: 'confidence-and-humility',
      href: '/desk/confidence-and-humility',
      title: 'Confidence and Humility, Working the Same Shift',
    },
    to: {
      surface: 'journal',
      id: '2026-07-30-confidence-and-humility',
      href: '/journal#journal-2026-07-30-confidence-and-humility',
      title: 'The Two-Handed Discipline',
    },
    relation: 'evidence',
    reason:
      'The publication receipt, source commit, and review trail behind this essay.',
    backlinkRelation: 'continues',
    backlinkReason:
      'The full essay developed from this recorded publication work.',
  },
] as const satisfies readonly ScrapbookRelationEdge[];

const MAX_RELATED_REFS = 4;
const EMPTY_REFS: readonly ScrapbookRef[] = Object.freeze([]);

function artifactKey(surface: ScrapbookSurface, id: string) {
  return `${surface}:${id}`;
}

function validateRelations(edges: readonly ScrapbookRelationEdge[]) {
  const directions = new Set<string>();

  for (const edge of edges) {
    const fromKey = artifactKey(edge.from.surface, edge.from.id);
    const toKey = artifactKey(edge.to.surface, edge.to.id);
    if (fromKey === toKey)
      throw new Error(`Scrapbook relation cannot point to itself: ${fromKey}`);

    const direction = `${fromKey}->${toKey}`;
    if (directions.has(direction))
      throw new Error(`Duplicate Scrapbook relation: ${direction}`);
    directions.add(direction);

    for (const artifact of [edge.from, edge.to]) {
      if (
        !artifact.id.trim() ||
        !artifact.title.trim() ||
        !artifact.href.startsWith('/')
      ) {
        throw new Error(
          `Scrapbook relation has an invalid public artifact: ${fromKey}`
        );
      }
    }

    if (!edge.reason.trim() || !edge.backlinkReason.trim()) {
      throw new Error(
        `Scrapbook relation needs a reader-facing reason: ${direction}`
      );
    }
  }
}

validateRelations(relations);

const relatedByArtifact = new Map<string, readonly ScrapbookRef[]>();

function appendRelated(artifact: ScrapbookArtifact, reference: ScrapbookRef) {
  const key = artifactKey(artifact.surface, artifact.id);
  const current = relatedByArtifact.get(key) ?? EMPTY_REFS;
  if (current.length >= MAX_RELATED_REFS) {
    throw new Error(
      `Scrapbook artifact exceeds ${MAX_RELATED_REFS} related links: ${key}`
    );
  }
  relatedByArtifact.set(
    key,
    Object.freeze([...current, Object.freeze(reference)])
  );
}

for (const edge of relations) {
  appendRelated(edge.from, {
    ...edge.to,
    relation: edge.relation,
    reason: edge.reason,
  });
  appendRelated(edge.to, {
    ...edge.from,
    relation: edge.backlinkRelation,
    reason: edge.backlinkReason,
  });
}

export const scrapbookRelations = relations;

export function getRelatedScrapbookRefs(
  surface: ScrapbookSurface,
  id: string
): readonly ScrapbookRef[] {
  return relatedByArtifact.get(artifactKey(surface, id)) ?? EMPTY_REFS;
}
