'use server';

import { eq, and, inArray } from 'drizzle-orm';
import { db } from '../db/db.server';
import { Tag } from '../definitions';
import { tags, projectTags, artifactTags } from '../db/schema';
import { v4 as uuid } from 'uuid';

export async function handleTagUpdateWithinTransaction(
  tx: any,
  accountId: string,
  itemId: string,
  newTags: string[],
  isProject: boolean
): Promise<void> {
  const tagsTable = isProject ? projectTags : artifactTags;
  const itemColumn = isProject ? 'projectId' : 'artifactId';

  for (const tagName of newTags) {
    let [existingTag] = await tx.select().from(tags)
      .where(and(eq(tags.name, tagName), eq(tags.accountId, accountId)))
      .limit(1);

    if (!existingTag) {
      const tagId = uuid();
      await tx.insert(tags).values({ id: tagId, name: tagName, accountId });
      existingTag = { id: tagId, name: tagName, accountId };
    }

    await tx.insert(tagsTable)
      .values({
        accountId,
        [itemColumn]: itemId,
        tagId: existingTag.id
      })
      .onConflictDoNothing();
  }
}

export async function handleTagUpdate(
  accountId: string,
  itemId: string,
  newTags: string[],
  isProject: boolean = false
): Promise<void> {
  await db.transaction(async (tx) => {
    await handleTagUpdateWithinTransaction(tx, accountId, itemId, newTags, isProject);
  });
}

// export async function ensureTagsExistWithinTransaction(
//   tx: any,
//   accountId: string,
//   tagNames: string[]
// ): Promise<Tag[]> {
//   const existingTags = await tx.select().from(tags)
//     .where(and(
//       eq(tags.accountId, accountId),
//       inArray(tags.name, tagNames)
//     ));

//   const existingTagNames = new Set(existingTags.map((tag: { name: string; }) => tag.name));
//   const newTagNames = tagNames.filter(name => !existingTagNames.has(name));

//   const createdTags: Tag[] = [];
//   for (const name of newTagNames) {
//     const newTag = { id: uuid(), accountId, name };
//     await tx.insert(tags).values(newTag);
//     createdTags.push(newTag);
//   }

//   return [...existingTags, ...createdTags];
// }

// export async function ensureTagsExist(
//   accountId: string,
//   tagNames: string[]
// ): Promise<Tag[]> {
//   return db.transaction(async (tx) => {
//     return ensureTagsExistWithinTransaction(tx, accountId, tagNames);
//   });
// }