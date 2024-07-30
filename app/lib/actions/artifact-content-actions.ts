'use server';

import { eq, and } from 'drizzle-orm';
import {  ArtifactContentSchema, } from '../definitions/definitions';
import { ArtifactContent } from "../definitions/definitions";
import { deleteFromS3 } from '../external/s3-operations';
import { artifactContents } from '../db/schema';
import { v4 as uuidv4 } from 'uuid';
import { deleteAllImageVersions } from '../image-processing/image-processing';
import { S3ResourceTracker } from '../external/s3-resource-tracker';

import { processImageContent, insertImageContent } from './content-handlers/image-content-handler';
import { processFileContent, insertFileContent } from './content-handlers/file-content-handler';
import { processLinkContent, insertLinkContent } from './content-handlers/link-content-handler';
import { processTextContent, insertTextContent } from './content-handlers/text-content-handler';

export async function handleContentUpdate(
  tx: any,
  accountId: string, 
  artifactId: string, 
  formData: FormData
): Promise<{ shouldDelete: boolean; newContentCount: number }> {
  const existingContents = await fetchExistingContents(tx, accountId, artifactId);
  const existingContentIds = new Set(existingContents.map(row => row.id));
  let newContentCount = 0;

  let index = 0;
  while (formData.get(`contentType-${index}`) !== null) {
    const content = await processContentItem(accountId, formData, index);

    if (content.content) {
      if (content.id) {
        await updateExistingContent(tx, accountId, content);
        existingContentIds.delete(content.id);
      } else {
        await insertNewContent(tx, accountId, artifactId, content);
      }
      newContentCount++;
    } else if (content.id) {
      existingContentIds.delete(content.id);
    }

    index++;
  }

  await deleteRemovedContents(tx, accountId, existingContents, existingContentIds);

  return { shouldDelete: newContentCount === 0, newContentCount };
}

async function fetchExistingContents(tx: any, accountId: string, artifactId: string): Promise<ArtifactContent[]> {
  return tx.select()
    .from(artifactContents)
    .where(and(
      eq(artifactContents.artifactId, artifactId),
      eq(artifactContents.accountId, accountId)
    ))
    .then((rows: any[]) => rows.map(row => ArtifactContentSchema.parse(row)));
}


async function processContentItem(accountId: string, formData: FormData, index: number): Promise<ArtifactContent> {
  const contentType = formData.get(`contentType-${index}`) as ArtifactContent['type'];
  const contentItem = formData.get(`content-${index}`);
  const contentId = formData.get(`contentId-${index}`) as string | null;

  switch (contentType) {
    case 'image':
      return processImageContent(accountId, contentItem as File, contentId, index, formData);
    case 'file':
      return processFileContent(accountId, contentItem as File, contentId, index, formData);
    case 'link':
      return processLinkContent(accountId, contentItem as string, contentId, index, formData);
    case 'text':
      return processTextContent(accountId, contentItem as string, contentId, index, formData);
    default:
      throw new Error(`Invalid content type: ${contentType}`);
  }
}

async function updateExistingContent(
  tx: any,
  accountId: string, 
  content: ArtifactContent
): Promise<void> {
  const existingContent = await tx.select().from(artifactContents).where(and(eq(artifactContents.id, content.id), eq(artifactContents.accountId, accountId))).limit(1);
  
  if (existingContent.length > 0 && existingContent[0].type === 'image' && content.type === 'image') {
    const existingMetadata = existingContent[0].metadata as ArtifactContent['metadata'];
    if ('variations' in existingMetadata) {
      await deleteAllImageVersions(existingMetadata.variations);
    }
  }

  await tx.update(artifactContents)
    .set({ 
      type: content.type, 
      content: content.content,
      metadata: content.metadata,
      updatedAt: new Date(),
      lastModifiedBy: accountId
    })
    .where(and(
      eq(artifactContents.id, content.id),
      eq(artifactContents.accountId, accountId)
    ));
}

export async function insertNewContent(
  tx: any,
  accountId: string, 
  artifactId: string, 
  content: ArtifactContent
): Promise<void> {
  await tx.insert(artifactContents).values({
    id: content.id || uuidv4(),
    accountId,
    artifactId,
    type: content.type,
    content: content.content,
    metadata: content.metadata,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: accountId,
    lastModifiedBy: accountId
  });
}

export async function deleteRemovedContents(
  tx: any,
  accountId: string, 
  existingContents: ArtifactContent[], 
  existingContentIds: Set<string>
): Promise<void> {
  for (const contentId of existingContentIds) {
    const contentToDelete = existingContents.find(row => row.id === contentId);
    if (contentToDelete) {
      if (contentToDelete.type === 'image') {
        const metadata = contentToDelete.metadata;
        if ('variations' in metadata) {
          await deleteAllImageVersions(metadata.variations);
        }
      } else if (contentToDelete.type === 'file') {
        await deleteFromS3(contentToDelete.content);
      }

      await tx.delete(artifactContents)
        .where(and(
          eq(artifactContents.id, contentId),
          eq(artifactContents.accountId, accountId)
        ));
    }
  }
}

export async function hasValidContent(formData: FormData): Promise<boolean> {
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
  const resourceTracker = new S3ResourceTracker();

  try {
    while (formData.get(`contentType-${index}`)) {
      const content = await processContentItem(accountId, formData, index);

      switch (content.type) {
        case 'image':
          await insertImageContent(tx, accountId, artifactId, content, resourceTracker);
          break;
        case 'file':
          await insertFileContent(tx, accountId, artifactId, content, resourceTracker);
          break;
        case 'link':
          await insertLinkContent(tx, accountId, artifactId, content);
          break;
        case 'text':
          await insertTextContent(tx, accountId, artifactId, content);
          allContent += content.content + ' ';
          break;
      }

      index++;
    }
    return allContent;
  } catch (error) {
    await resourceTracker.cleanup();
    throw error;
  }
}