import { eq, and } from 'drizzle-orm';
import { db } from '../db/db.server';
import { ContentType, ArtifactContent } from '../definitions';
import { uploadToS3, deleteFromS3 } from '../external/s3-operations';
import { artifactContents } from '../db/schema';
import { v4 as uuidv4 } from 'uuid';

export async function handleContentUpdate(accountId: string, artifactId: string, formData: FormData): Promise<boolean> {
  const existingContents = await fetchExistingContents(accountId, artifactId);
  const existingContentIds = new Set(existingContents.map(row => row.id));
  let newContentCount = 0;

  let index = 0;
  while (formData.get(`contentType-${index}`) !== null) {
    const { contentType, content, contentId } = await processContentItem(accountId, formData, index);

    if (content) {
      if (contentId) {
        await updateExistingContent(accountId, contentId, contentType, content);
        existingContentIds.delete(contentId);
      } else {
        await insertNewContent(accountId, artifactId, contentType, content);
      }
      newContentCount++;
    } else if (contentId) {
      existingContentIds.delete(contentId);
    }

    index++;
  }

  await deleteRemovedContents(accountId, existingContents, existingContentIds);

  return newContentCount > 0;
}

async function fetchExistingContents(accountId: string, artifactId: string): Promise<ArtifactContent[]> {
  return db.select()
    .from(artifactContents)
    .where(and(
      eq(artifactContents.artifactId, artifactId),
      eq(artifactContents.accountId, accountId)
    ))
    .then(rows => rows.map(row => ({
      ...row,
      type: row.type as ContentType
    })));
}

async function processContentItem(accountId: string, formData: FormData, index: number): Promise<{ contentType: ContentType; content: string | null; contentId: string | null }> {
  const contentType = formData.get(`contentType-${index}`) as ContentType;
  const contentItem = formData.get(`content-${index}`);
  const contentIdValue = formData.get(`contentId-${index}`);
  const contentId = typeof contentIdValue === 'string' ? contentIdValue : null;

  let content: string | null = null;
  if (contentType === 'text') {
    content = (contentItem as string).trim() || null;
  } else if (contentItem instanceof File) {
    content = await uploadToS3(contentItem, contentType, accountId);
  } else if (typeof contentItem === 'string' && contentItem.startsWith('data:')) {
    const base64Data = contentItem.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    content = await uploadToS3(buffer, contentType, accountId);
  }

  return { contentType, content, contentId };
}

async function updateExistingContent(accountId: string, contentId: string, contentType: ContentType, content: string): Promise<void> {
  await db.update(artifactContents)
    .set({ type: contentType, content: content })
    .where(and(
      eq(artifactContents.id, contentId),
      eq(artifactContents.accountId, accountId)
    ));
}

async function insertNewContent(accountId: string, artifactId: string, contentType: ContentType, content: string): Promise<void> {
  await db.insert(artifactContents).values({
    id: uuidv4(),
    accountId,
    artifactId,
    type: contentType,
    content,
    createdAt: new Date()
  });
}

async function deleteRemovedContents(accountId: string, existingContents: ArtifactContent[], existingContentIds: Set<string>): Promise<void> {
  for (const contentId of existingContentIds) {
    const contentToDelete = existingContents.find(row => row.id === contentId);
    if (contentToDelete && (contentToDelete.type === 'image' || contentToDelete.type === 'file')) {
      await deleteFromS3(contentToDelete.content);
    }
    await db.delete(artifactContents)
      .where(and(
        eq(artifactContents.id, contentId),
        eq(artifactContents.accountId, accountId)
      ));
  }
}

export function hasValidContent(formData: FormData): boolean {
  let index = 0;
  while (formData.get(`contentType-${index}`)) {
    const contentItem = formData.get(`content-${index}`);
    if (contentItem && (typeof contentItem === 'string' ? contentItem.trim() !== '' : true)) {
      return true;
    }
    index++;
  }
  return false;
}

export async function insertContents(tx: any, accountId: string, artifactId: string, formData: FormData): Promise<string> {
  let allContent = '';
  let index = 0;
  while (formData.get(`contentType-${index}`)) {
    const contentType = formData.get(`contentType-${index}`) as ContentType;
    const contentItem = formData.get(`content-${index}`);

    if (contentType === 'text') {
      allContent += contentItem + ' ';
    }

    let content: string;
    if (contentType === 'text') {
      content = contentItem as string;
    } else if (contentItem instanceof File) {
      content = await uploadToS3(contentItem, contentType, accountId);
    } else {
      throw new Error(`Invalid content for type ${contentType}`);
    }

    await tx.insert(artifactContents).values({
      id: uuidv4(),
      accountId,
      artifactId,
      type: contentType,
      content,
      createdAt: new Date()
    });

    index++;
  }
  return allContent;
}