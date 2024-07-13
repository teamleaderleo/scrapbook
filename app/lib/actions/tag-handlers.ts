import { eq, and } from 'drizzle-orm';
import { db } from '../db/db.server';
import { Tag } from '../definitions';
import { artifactTags, tags, projectTags } from '../db/schema';
import { v4 as uuid } from 'uuid';

export async function handleTagUpdate(accountId: string, itemId: string, newTags: string[], isProject: boolean = false): Promise<void> {
  const currentTags = await fetchCurrentTags(accountId, itemId, isProject);
  await removeDeletedTags(accountId, itemId, currentTags, newTags, isProject);
  await addNewTags(accountId, itemId, currentTags, newTags, isProject);
}

async function fetchCurrentTags(accountId: string, itemId: string, isProject: boolean): Promise<Tag[]> {
  const tagsTable = isProject ? projectTags : artifactTags;
  const itemColumn = isProject ? projectTags.projectId : artifactTags.artifactId;

  const result = await db.select({
    id: tags.id,
    accountId: tags.accountId,
    name: tags.name
  })
    .from(tagsTable)
    .leftJoin(tags, eq(tagsTable.tagId, tags.id))
    .where(and(
      eq(itemColumn, itemId),
      eq(tagsTable.accountId, accountId)
    ));

  return result.filter((tag): tag is Tag => 
    tag.id !== null && tag.accountId !== null && tag.name !== null
  );
}

async function removeDeletedTags(accountId: string, itemId: string, currentTags: Tag[], newTags: string[], isProject: boolean): Promise<void> {
  const tagsTable = isProject ? projectTags : artifactTags;
  const itemColumn = isProject ? projectTags.projectId : artifactTags.artifactId;

  for (const tag of currentTags) {
    if (!newTags.includes(tag.name)) {
      await db.delete(tagsTable)
        .where(and(
          eq(itemColumn, itemId),
          eq(tagsTable.tagId, tag.id),
          eq(tagsTable.accountId, accountId)
        ));
    }
  }
}

async function addNewTags(accountId: string, itemId: string, currentTags: Tag[], newTags: string[], isProject: boolean): Promise<void> {
  const tagsTable = isProject ? projectTags : artifactTags;

  for (const tagName of newTags) {
    if (!currentTags.some(tag => tag.name === tagName)) {
      let tagId = await getOrCreateTag(accountId, tagName);
      await db.insert(tagsTable).values({
        [isProject ? 'projectId' : 'artifactId']: itemId,
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