export type SortBy = "score" | "updatedAt" | "createdAt";
export type SortDir = "asc" | "desc";

export type ParsedQuery = {
  tags: string[];                  // free tags like ["leetcode","inspiration"]
  ops: Record<string, string[]>;   // structured ops: { company:["amazon"], diff:["easy"] }
  order?: `${SortBy}:${SortDir}` | "fsrs";  // normalized order field
};

const ORDER_MAP: Record<string, `${SortBy}:${SortDir}` | "fsrs"> = {
  recent: "updatedAt:desc",
  newest: "createdAt:desc",
  oldest: "createdAt:asc",
  score: "score:desc",
  fsrs: "fsrs",
};



export function parseQuery(input: string | null | undefined): ParsedQuery {
  if (!input) return { tags: [], ops: {} };
  const query = decodeURIComponent(input).trim();
  const tokens = tokenize(query);

  const tags: string[] = [];
  const ops: Record<string, string[]> = {};
  let order: ParsedQuery["order"] | undefined;

  for (const t of tokens) {
    const m = t.match(/^([^:\s]+):(.+)$/);
    if (m) {
      const key = m[1].toLowerCase();
      const val = m[2].toLowerCase();
      if (key === "order") {
        order = ORDER_MAP[val] ?? "updatedAt:desc";
      } else {
        ops[key] ??= [];
        ops[key].push(val);
      }
    } else {
      tags.push(t.toLowerCase());
    }
  }
  return { tags, ops, order };
}

function tokenize(s: string): string[] {
  const out: string[] = [];
  let i = 0, buf = "", inQuote = false;

  while (i < s.length) {
    const ch = s[i];
    if (ch === '"') { inQuote = !inQuote; i++; continue; }
    if (!inQuote && /\s+/.test(ch)) {
      if (buf) { out.push(buf); buf = ""; }
      i++; continue;
    }
    buf += ch; i++;
  }
  if (buf) out.push(buf);
  return out;
}
