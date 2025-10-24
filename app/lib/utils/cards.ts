import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { SpaceCard } from '@/app/lib/definitions/space';

const CARDS_PATH = path.join(process.cwd(), 'content/cards');

function parseCard(fileName: string): SpaceCard {
  const slug = fileName.replace(/\.mdx?$/, '');
  const filePath = path.join(CARDS_PATH, fileName);
  const fileContents = fs.readFileSync(filePath, 'utf8');
  
  const { data, content } = matter(fileContents);
  
  return {
    id: data.id,
    slug,
    question: data.question,
    answer: content,
    category: data.category,
    tags: data.tags || [],
    dueDate: new Date(data.dueDate),
    interval: data.interval || 1,
    easeFactor: data.easeFactor || 2.5,
    repetitions: data.repetitions || 0,
    createdDate: new Date(data.createdDate),
    lastReviewed: data.lastReviewed ? new Date(data.lastReviewed) : undefined,
    sourceUrl: data.sourceUrl,
  };
}

export async function getSpaceCards(): Promise<SpaceCard[]> {
  const cardFiles = fs
    .readdirSync(CARDS_PATH)
    .filter((file) => /\.mdx?$/.test(file));

  const cards = cardFiles.map(parseCard);

  return cards.sort((a, b) => 
    a.dueDate.getTime() - b.dueDate.getTime()
  );
}

export async function getDueCards(): Promise<SpaceCard[]> {
  const allCards = await getSpaceCards();
  const now = new Date();
  return allCards.filter(card => card.dueDate <= now);
}

export async function getSpaceCard(slug: string): Promise<SpaceCard | null> {
  try {
    return parseCard(`${slug}.mdx`);
  } catch (e) {
    return null;
  }
}

export async function getCardsByCategory(category: string): Promise<SpaceCard[]> {
  const allCards = await getSpaceCards();
  return allCards.filter(card => card.category === category);
}