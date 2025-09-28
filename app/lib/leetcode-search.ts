import { LCItem } from "./leetcode-data";
import { ParsedQuery } from "./searchlang";
import { compareNumber } from "./num-compare";
import { retrievabilityNow } from "./fsrs-adapter";

export function searchLeetcode(items: LCItem[], q: ParsedQuery, nowMs: number): LCItem[] {
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
      case "is":
        for (const flag of vals) {
          if (flag === "due") {
            res = res.filter(it => it.review && !it.review.suspended && it.review.due <= nowMs);
          }
          if (flag === "suspended") {
            res = res.filter(it => it.review?.suspended);
          }
        }
        break;
      case "interval":
        res = res.filter(it => it.review && vals.every(v => compareNumber(it.review!.scheduled_days, v)));
        break;
      case "stability":
        res = res.filter(it => it.review && vals.every(v => compareNumber(it.review!.stability, v)));
        break;
      case "difficulty":
        res = res.filter(it => it.review && vals.every(v => compareNumber(it.review!.difficulty, v)));
        break;
    }
  }

  // normal sort
  if (q.order && q.order !== "fsrs") {
    const [by, dir] = q.order.split(":") as ["score"|"updatedAt"|"createdAt","asc"|"desc"];
    res.sort((a, b) => {
      const av = (a as any)[by] ?? 0;
      const bv = (b as any)[by] ?? 0;
      return dir === "asc" ? av - bv : bv - av;
    });
  }

  // FSRS urgency sort
  if (q.order === "fsrs") {
    res.sort((a, b) => {
      const ra = a.review ? retrievabilityNow(a.review, nowMs) : 1;
      const rb = b.review ? retrievabilityNow(b.review, nowMs) : 1;
      return ra - rb;
    });
  }

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
