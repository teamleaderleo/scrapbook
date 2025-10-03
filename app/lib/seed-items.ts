import { supabase } from "./db/supabase";

const SEED_ITEMS = [
  {
    id: "two-sum",
    title: "Two Sum",
    slug: "two-sum",
    url: "https://leetcode.com/problems/two-sum/",
    tags: ["type:leetcode", "company:amazon", "company:google", "topic:array", "topic:hashmap", "difficulty:easy"],
    category: "leetcode",
    score: 100,
  },
  {
    id: "longest-substring",
    title: "Longest Substring Without Repeating Characters",
    slug: "longest-substring-without-repeating-characters",
    url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
    tags: ["type:leetcode", "company:google", "company:meta", "topic:string", "topic:sliding-window", "topic:hashset", "difficulty:medium"],
    category: "leetcode",
    score: 95,
  },
];

async function seed() {
  const { error } = await supabase.from('items').upsert(
    SEED_ITEMS.map(it => ({
      id: it.id,
      title: it.title,
      slug: it.slug,
      url: it.url,
      tags: it.tags,
      category: it.category,
      score: it.score,
      content: '',
      content_type: 'markdown',
    }))
  );

  if (error) {
    console.error('Error seeding:', error);
  } else {
    console.log(`✅ Seeded ${SEED_ITEMS.length} items`);
  }
}

seed();