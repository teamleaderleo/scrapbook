import { LCItem } from "./leetcode-data";
import { ParsedQuery } from "./searchlang";

export function searchLeetcode(items: LCItem[], q: ParsedQuery): LCItem[] {
  let res = items.slice();

  // plain tags
  if (q.tags.length) {
    res = res.filter(it => q.tags.every(t => hasTag(it, t)));
  }

  // ops
  for (const [key, vals] of Object.entries(q.ops)) {
    switch (key) {
      case "company":
        res = res.filter(it => vals.every(v => it.companies.includes(v)));
        break;
      case "topic":
        res = res.filter(it => vals.every(v => it.topics.includes(v)));
        break;
      case "diff":
      case "difficulty":
        res = res.filter(it => vals.includes(it.difficulty));
        break;
    }
  }

  // sort
  const order = q.order ?? "updatedAt:desc";
  const [by, dir] = order.split(":") as ["score"|"updatedAt"|"createdAt","asc"|"desc"];
  res.sort((a, b) => {
    const av = (a as any)[by] ?? 0;
    const bv = (b as any)[by] ?? 0;
    return dir === "asc" ? av - bv : bv - av;
  });

  return res;
}

function hasTag(it: LCItem, tag: string) {
  return (
    it.tags.includes(tag) ||
    it.companies.includes(tag) ||
    it.topics.includes(tag) ||
    it.difficulty === tag
  );
}
