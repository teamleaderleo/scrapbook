import type { Item } from "./item-types";
import type { ParsedQuery } from "./searchlang";
import { compareNumber } from "./num-compare";
import { retrievabilityNow } from "./fsrs-adapter";

export function searchItems(items: Item[], q: ParsedQuery, nowMs: number): Item[] {
  let res = items.slice();

  // Plain tags (search across all tag namespaces)
  if (q.tags.length) {
    res = res.filter(it => q.tags.every(t => hasTag(it, t)));
  }

  // Namespaced operators. Known operators may map to item fields or review
  // state; every other namespace falls back to an exact tag match so new
  // taxonomies do not require search-engine code changes.
  for (const [key, vals] of Object.entries(q.ops)) {
    switch (key) {
      case "diff":
        res = res.filter(it => vals.every(v => hasTagCaseInsensitive(it, `difficulty:${v}`)));
        break;
      case "company":
      case "topic":
      case "difficulty":
      case "type":
        res = res.filter(it => vals.every(v => hasTagCaseInsensitive(it, `${key}:${v}`)));
        break;
      case "category":
        res = res.filter(it => vals.some(v => it.category.toLowerCase() === v));
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
      default:
        res = res.filter(it =>
          vals.every(v => hasTagCaseInsensitive(it, `${key}:${v}`))
        );
        break;
    }
  }

  // Sorting
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

function hasTag(it: Item, tag: string) {
  const tagLower = tag.toLowerCase();

  // Check exact tag match
  if (it.tags.some(value => value.toLowerCase() === tagLower)) return true;
  
  // Check category match
  if (it.category.toLowerCase() === tagLower) return true;
  
  // Check if tag appears in any tag value (after the colon)
  // e.g., searching "easy" should match "difficulty:easy"
  const tagValues = it.tags
    .map(t => t.includes(':') ? t.split(':')[1] : t)
    .join(' ')
    .toLowerCase();
  
  if (tagValues.includes(tagLower)) return true;
  
  // Check if tag appears in title
  if (it.title.toLowerCase().includes(tagLower)) return true;
  
  return false;
}

function hasTagCaseInsensitive(it: Item, tag: string) {
  const tagLower = tag.toLowerCase();
  return it.tags.some(t => t.toLowerCase() === tagLower);
}
