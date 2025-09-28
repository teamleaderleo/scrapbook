import type { ReviewState } from "./review-types";

export type LCItem = {
  id: string;
  title: string;
  slug: string;
  url: string;
  companies: string[];
  topics: string[];
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  createdAt: number;
  updatedAt: number;
  score?: number;
  review?: ReviewState;
};

export const ITEMS: LCItem[] = [
  {
    id: "two-sum",
    title: "Two Sum",
    slug: "two-sum",
    url: "https://leetcode.com/problems/two-sum/",
    companies: ["amazon", "google"],
    topics: ["array", "hashmap"],
    difficulty: "easy",
    tags: ["leetcode"],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 90,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    score: 100,
  },
  {
    id: "longest-substring",
    title: "Longest Substring Without Repeating Characters",
    slug: "longest-substring-without-repeating-characters",
    url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
    companies: ["google", "meta"],
    topics: ["string", "sliding-window", "hashset"],
    difficulty: "medium",
    tags: ["leetcode"],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 40,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
    score: 95,
  },
];
