import impactCandidatesJson from '@/public/data/impact-pr-candidates-v1.json';
import impactIndexJson from '@/public/data/impact-index-v1.json';
import impactSummaryJson from '@/public/data/impact-summary-v1.json';

export const impactCandidates = impactCandidatesJson;
export const impactIndex = impactIndexJson;
export const impactSummary = impactSummaryJson;

export type ImpactCandidate = (typeof impactCandidates.records)[number];
export type ImpactRecord = (typeof impactIndex.records)[number];

export type ImpactQuery = {
  q?: string;
  repo?: string;
  area?: string;
  dimension?: string;
  id?: string;
};

export function queryImpactRecords(filters: ImpactQuery = {}): ImpactRecord[] {
  const q = (filters.q ?? '').trim().toLowerCase();
  const repo = (filters.repo ?? '').trim();
  const area = (filters.area ?? '').trim();
  const dimension = (filters.dimension ?? '').trim();
  const id = (filters.id ?? '').trim();

  return impactIndex.records.filter(record => {
    if (id && record.id !== id) return false;
    if (repo && record.repository !== repo) return false;
    if (area && !record.areas.includes(area)) return false;
    if (
      dimension &&
      !record.claims.some(claim => claim.dimension === dimension)
    ) {
      return false;
    }
    if (!q) return true;

    const haystack = [
      record.id,
      record.repository,
      record.title,
      record.summary,
      ...record.areas,
      ...record.claims.flatMap(claim => [
        claim.dimension,
        claim.metric,
        claim.note ?? '',
        claim.population ?? '',
      ]),
    ]
      .join('\n')
      .toLowerCase();

    return haystack.includes(q);
  });
}


export type ImpactCandidateQuery = {
  q?: string;
  repo?: string;
  limit?: number;
};

export function queryImpactCandidateRecords(
  filters: ImpactCandidateQuery = {}
): ImpactCandidate[] {
  const q = (filters.q ?? '').trim().toLowerCase();
  const repo = (filters.repo ?? '').trim();
  const requestedLimit = filters.limit ?? 30;
  const limit =
    Number.isInteger(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, 100)
      : 30;

  return impactCandidates.records
    .filter(record => !repo || record.repository === repo)
    .filter(record => {
      if (!q) return true;
      return [record.title, ...record.labels, ...record.metricHints]
        .join('\n')
        .toLowerCase()
        .includes(q);
    })
    .sort(
      (a, b) =>
        b.metricHints.length - a.metricHints.length ||
        String(b.mergedAt ?? '').localeCompare(String(a.mergedAt ?? ''))
    )
    .slice(0, limit);
}
