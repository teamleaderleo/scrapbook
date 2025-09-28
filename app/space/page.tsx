import Link from "next/link";
import { ITEMS } from "../lib/leetcode-data";
import { parseQuery } from "../lib/searchlang";
import { searchLeetcode } from "../lib/leetcode-search";

export default function SpacePage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const tagsParam = typeof searchParams.tags === "string" ? searchParams.tags : undefined;
  const q = parseQuery(tagsParam);
  const results = searchLeetcode(ITEMS, q);

  return (
    <main className="p-4">
      <h1 className="text-xl font-semibold mb-2">LeetCode</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Query: {tagsParam || "(none)"}
      </p>
      <ul className="space-y-2">
        {results.map((it) => (
          <li key={it.id} className="rounded border p-3">
            <div className="flex items-center justify-between">
              <Link
                href={it.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:underline"
              >
                {it.title}
              </Link>
              <span className="text-xs text-muted-foreground capitalize">{it.difficulty}</span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              companies: {it.companies.join(", ")} · topics: {it.topics.join(", ")}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}