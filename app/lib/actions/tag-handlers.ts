import { eq, and } from 'drizzle-orm';
import { db } from '../db/db.server';
import { Tag } from '../definitions';
import { artifactTags, tags } from '../db/schema';
import { v4 as uuid } from 'uuid';

export async function handleTagUpdate(accountId: string, artifactId: string, newTags: string[]): Promise<void> {
  const currentTags = await fetchCurrentTags(accountId, artifactId);
  await removeDeletedTags(accountId, artifactId, currentTags, newTags);
  await addNewTags(accountId, artifactId, currentTags, newTags);
}

async function fetchCurrentTags(accountId: string, artifactId: string): Promise<Tag[]> {
  const result = await db.select({
    id: tags.id,
    accountId: tags.accountId,
    name: tags.name
  })
    .from(artifactTags)
    .leftJoin(tags, eq(artifactTags.tagId, tags.id))
    .where(and(
      eq(artifactTags.artifactId, artifactId),
      eq(artifactTags.accountId, accountId)
    ));

  return result.filter((tag): tag is Tag => 
    tag.id !== null && tag.accountId !== null && tag.name !== null
  );
}

async function removeDeletedTags(accountId: string, artifactId: string, currentTags: Tag[], newTags: string[]): Promise<void> {
  for (const tag of currentTags) {
    if (!newTags.includes(tag.name)) {
      await db.delete(artifactTags)
        .where(and(
          eq(artifactTags.artifactId, artifactId),
          eq(artifactTags.tagId, tag.id),
          eq(artifactTags.accountId, accountId)
        ));
    }
  }
}

async function addNewTags(accountId: string, artifactId: string, currentTags: Tag[], newTags: string[]): Promise<void> {
  for (const tagName of newTags) {
    if (!currentTags.some(tag => tag.name === tagName)) {
      let tagId = await getOrCreateTag(accountId, tagName);
      await db.insert(artifactTags).values({
        artifactId,
        tagId,
        accountId
      });
    }
  }
}

async function getOrCreateTag(accountId: string, tagName: string): Promise<string> {
  let existingTag = await db.select({ id: tags.id })
    .from(tags)
    .where(and(eq(tags.name, tagName), eq(tags.accountId, accountId)))
    .limit(1);

  if (existingTag.length > 0) {
    return existingTag[0].id;
  } else {
    const newTagId = uuid();
    await db.insert(tags).values({ id: newTagId, name: tagName, accountId });
    return newTagId;
  }
}