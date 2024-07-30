'use server';

import { eq, and } from 'drizzle-orm';
import { db } from '../db/db';
import {  ContentMetadataSchema, ContentType, } from '../definitions/definitions';
import { ArtifactContent } from "../definitions/definitions";
import { uploadToS3, deleteFromS3 } from '../external/s3-operations';
import { artifactContents } from '../db/schema';
import { v4 as uuidv4 } from 'uuid';
import { deleteAllImageVersions, processAndUploadImage } from '../image-processing/image-processing';
import { S3ResourceTracker } from '../external/s3-resource-tracker';
import { z } from 'zod';

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
    const { contentType, content, contentId, metadata } = await processContentItem(accountId, formData, index);

    if (content) {
      if (contentId) {
        await updateExistingContent(tx, accountId, contentId, contentType, content, metadata);
        existingContentIds.delete(contentId);
      } else {
        await insertNewContent(tx, accountId, artifactId, contentType, content, metadata);
      }
      newContentCount++;
    } else if (contentId) {
      existingContentIds.delete(contentId);
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
    .then((rows: any[]) => rows.map(row => ({
      ...row,
      type: row.type as ContentType,
      metadata: row.metadata as Record<string, unknown> | null,
      createdBy: row.createdBy || accountId,
      lastModifiedBy: row.lastModifiedBy || accountId,
    })));
}


async function processContentItem(accountId: string, formData: FormData, index: number) {
  const contentType = formData.get(`contentType-${index}`) as ContentType;
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
  contentId: string, 
  contentType: ContentType, 
  content: string, 
  metadata: z.infer<typeof ContentMetadataSchema>
): Promise<void> {
  const existingContent = await tx.select().from(artifactContents).where(and(eq(artifactContents.id, contentId), eq(artifactContents.accountId, accountId))).limit(1);
  
  if (existingContent.length > 0 && existingContent[0].type === 'image') {
    const existingMetadata = existingContent[0].metadata as z.infer<typeof ContentMetadataSchema>;
    if (existingMetadata.type === 'image') {
      await deleteAllImageVersions(existingMetadata.variations || {});
    }
  }

  await db.update(artifactContents)
    .set({ 
      type: contentType, 
      content: content,
      metadata: metadata,
      updatedAt: new Date(),
      lastModifiedBy: accountId
    })
    .where(and(
      eq(artifactContents.id, contentId),
      eq(artifactContents.accountId, accountId)
    ));
}

export async function insertNewContent(
  tx: any,
  accountId: string, 
  artifactId: string, 
  contentType: ContentType, 
  content: string, 
  metadata: z.infer<typeof ContentMetadataSchema>
): Promise<void> {
  await tx.insert(artifactContents).values({
    id: uuidv4(),
    accountId,
    artifactId,
    type: contentType,
    content,
    metadata: ensureValidMetadata(metadata),
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
        const metadata = contentToDelete.metadata as z.infer<typeof ContentMetadataSchema>;
        if (metadata.type === 'image') {
          await deleteAllImageVersions(metadata.variations || {});
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

// Helper function to ensure metadata has valid structure
function ensureValidMetadata(metadata: z.infer<typeof ContentMetadataSchema>): z.infer<typeof ContentMetadataSchema> {
  if (metadata.type === 'image' && !metadata.variations) {
    return { ...metadata, variations: {} };
  }
  return metadata;
}

export async function insertContents(tx: any, accountId: string, artifactId: string, formData: FormData): Promise<string> {
  let allContent = '';
  let index = 0;
  const resourceTracker = new S3ResourceTracker();

  try {
    while (formData.get(`contentType-${index}`)) {
      const { contentType, content, metadata } = await processContentItem(accountId, formData, index);

      switch (contentType) {
        case 'image':
          await insertImageContent(tx, accountId, artifactId, content, metadata, resourceTracker);
          break;
        case 'file':
          await insertFileContent(tx, accountId, artifactId, content, metadata, resourceTracker);
          break;
        case 'link':
          await insertLinkContent(tx, accountId, artifactId, content, metadata);
          break;
        case 'text':
          await insertTextContent(tx, accountId, artifactId, content, metadata);
          allContent += content + ' ';
          break;
        default:
          throw new Error(`Invalid content type: ${contentType}`);
      }

      index++;
    }
    return allContent;
  } catch (error) {
    await resourceTracker.cleanup();
    throw error;
  }
}