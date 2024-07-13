import { Tag } from '../definitions';
import { v4 as uuid } from 'uuid';

let db: any;

async function getDb() {
  if (typeof window === 'undefined') {
    const { db: importedDb } = await import('../db/db.server');
    db = importedDb;
  }
  return db;
}

export async function handleTagUpdate(accountId: string, itemId: string, newTags: string[], isProject: boolean = false): Promise<void> {
  const db = await getDb();
  const currentTags = await fetchCurrentTags(db, accountId, itemId, isProject);
  await removeDeletedTags(db, accountId, itemId, currentTags, newTags, isProject);
  await addNewTags(db, accountId, itemId, currentTags, newTags, isProject);
}

async function fetchCurrentTags(db: any, accountId: string, itemId: string, isProject: boolean): Promise<Tag[]> {
  const { tags, artifactTags, projectTags } = await import('../db/schema');
  const { eq, and } = await import('drizzle-orm');

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

  return result.filter((tag: any): tag is Tag => 
    tag.id !== null && tag.accountId !== null && tag.name !== null
  );
}

async function removeDeletedTags(db: any, accountId: string, itemId: string, currentTags: Tag[], newTags: string[], isProject: boolean): Promise<void> {
  const { artifactTags, projectTags } = await import('../db/schema');
  const { eq, and } = await import('drizzle-orm');

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

async function addNewTags(db: any, accountId: string, itemId: string, currentTags: Tag[], newTags: string[], isProject: boolean): Promise<void> {
  const { artifactTags, projectTags } = await import('../db/schema');

  const tagsTable = isProject ? projectTags : artifactTags;

  for (const tagName of newTags) {
    if (!currentTags.some(tag => tag.name === tagName)) {
      let tagId = await getOrCreateTag(db, accountId, tagName);
      await db.insert(tagsTable).values({
        [isProject ? 'projectId' : 'artifactId']: itemId,
        tagId,
        accountId
      });
    }
  }
}

async function getOrCreateTag(db: any, accountId: string, tagName: string): Promise<string> {
  const { tags } = await import('../db/schema');
  const { eq, and } = await import('drizzle-orm');

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

export async function getProjectTags(accountId: string, projectId: string): Promise<Tag[]> {
  const db = await getDb();
  return fetchCurrentTags(db, accountId, projectId, true);
}

export async function getArtifactTags(accountId: string, artifactId: string): Promise<Tag[]> {
  const db = await getDb();
  return fetchCurrentTags(db, accountId, artifactId, false);
}