'use server';

import { eq, and } from 'drizzle-orm';
import { db } from '../db/db.server';
import {  ContentType, } from '../definitions/definitions';
import { ArtifactContent } from "../definitions/definitions";
import { uploadToS3, deleteFromS3 } from '../external/s3-operations';
import { artifactContents } from '../db/schema';
import { v4 as uuidv4 } from 'uuid';
import { deleteAllImageVersions, processAndUploadImage } from '../image-processing/image-processing';
import { S3ResourceTracker } from '../external/s3-resource-tracker';

export async function handleContentUpdate(accountId: string, artifactId: string, formData: FormData): Promise<{ shouldDelete: boolean; newContentCount: number }> {
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

  return { shouldDelete: newContentCount === 0, newContentCount };
}

export async function fetchExistingContents(accountId: string, artifactId: string): Promise<ArtifactContent[]> {
  return db.select()
    .from(artifactContents)
    .where(and(
      eq(artifactContents.artifactId, artifactId),
      eq(artifactContents.accountId, accountId)
    ))
    .then(rows => rows.map(row => ({
      ...row,
      type: row.type as ContentType,
      metadata: row.metadata as Record<string, unknown> | null,
      createdBy: row.createdBy || accountId,
      lastModifiedBy: row.lastModifiedBy || accountId,
    })));
}


async function processContentItem(accountId: string, formData: FormData, index: number): Promise<{
  contentType: ContentType;
  content: string;
  contentId: string | null;
  variants?: ContentVariant[];
  metadata?: {
    originalName?: string;
    size?: number;
    mimeType?: string;
    originalUrl?: string;
    [key: string]: unknown;
  };
}> {
  const contentType = formData.get(`contentType-${index}`) as ContentType;
  const contentItem = formData.get(`content-${index}`);
  const contentId = formData.get(`contentId-${index}`) as string | null;

  switch (contentType) {
    case 'image':
      if (!(contentItem instanceof File)) {
        throw new Error(`Invalid image content`);
      }
      const processedImage = await processAndUploadImage(contentItem, accountId);
      return {
        contentType,
        content: processedImage.compressed,
        contentId,
        variants: Object.entries(processedImage.thumbnails).map(([key, url]) => ({ type: key as "link" | "embed" | "text" | "longText" | "image" | "file", url: url as string })),
        metadata: { 
          originalName: contentItem.name,
          size: contentItem.size,
          originalUrl: processedImage.original
        }
      };

    case 'file':
      if (!(contentItem instanceof File)) {
        throw new Error(`Invalid file content`);
      }
      const fileUrl = await uploadToS3(contentItem, contentType, accountId, 'original');
      return {
        contentType,
        content: fileUrl,
        contentId,
        metadata: {
          originalName: contentItem.name,
          size: contentItem.size,
          mimeType: contentItem.type
        }
      };

    case 'link':
    case 'embed':
      return {
        contentType,
        content: contentItem as string,
        contentId,
        metadata: {
          title: formData.get(`${contentType}Title-${index}`),
          description: formData.get(`${contentType}Description-${index}`)
        }
      };

    default:
      return {
        contentType,
        content: (contentItem as string).trim(),
        contentId
      };
  }
}

async function updateExistingContent(accountId: string, contentId: string, contentType: ContentType, content: string, variants?: ContentVariant[], metadata?: Record<string, unknown>): Promise<void> {
  const existingContent = await db.select().from(artifactContents).where(and(eq(artifactContents.id, contentId), eq(artifactContents.accountId, accountId))).limit(1);
  
  if (existingContent.length > 0 && existingContent[0].type === 'image') {
    // Delete existing image versions
    const existingVersions: ImageVersions = {
      original: (existingContent[0].metadata as { originalUrl?: string })?.originalUrl || '',
      compressed: existingContent[0].content,
      thumbnails: Object.fromEntries((existingContent[0].variants as ContentVariant[] || []).map(v => [v.type, v.url]))
    };
    await deleteAllImageVersions(existingVersions);
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

async function insertNewContent(accountId: string, artifactId: string, contentType: ContentType, content: string): Promise<void> {
  await db.insert(artifactContents).values({
    id: uuidv4(),
    accountId,
    artifactId,
    type: contentType,
    content,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: accountId,
    lastModifiedBy: accountId
  });
}

export async function deleteRemovedContents(accountId: string, existingContents: ArtifactContent[], existingContentIds: Set<string>): Promise<void> {
  for (const contentId of existingContentIds) {
    const contentToDelete = existingContents.find(row => row.id === contentId);
    if (contentToDelete) {
      if (contentToDelete.type === 'image') {
        // Delete the main content (original image)
        await deleteFromS3(contentToDelete.content);
        
        // Delete variants (thumbnails and compressed version)
        if (contentToDelete.variants) {
          for (const variant of contentToDelete.variants) {
            await deleteFromS3(variant.url);
          }
        }
        if (contentToDelete.metadata && typeof contentToDelete.metadata.compressed === 'string') {
          await deleteFromS3(contentToDelete.metadata.compressed);
        }
      } else if (contentToDelete.type === 'file') {
        // Delete the file
        await deleteFromS3(contentToDelete.content);
      }

      // Delete the content record from the database
      await db.delete(artifactContents)
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
      const contentType = formData.get(`contentType-${index}`) as ContentType;
      const contentItem = formData.get(`content-${index}`);

      let content: string;
      let variants: ContentVariant[] | undefined;
      let metadata: Record<string, unknown> | undefined;

      if (contentType === 'text' || contentType === 'longText') {
        content = contentItem as string;
        allContent += content + ' ';
        metadata = { wordCount: content.trim().split(/\s+/).length };
      } else if (contentType === 'image' && contentItem instanceof File) {
        const processedImage = await processAndUploadImage(contentItem, accountId);
        content = processedImage.original;
        variants = Object.entries(processedImage.thumbnails).map(([key, url]) => ({ type: key as "link" | "embed" | "text" | "longText" | "image" | "file", url: url as string }));
        metadata = { 
          originalName: contentItem.name,
          size: contentItem.size,
          compressed: processedImage.compressed
        };
        resourceTracker.addResource(processedImage.original);
        resourceTracker.addResource(processedImage.compressed);
        Object.values(processedImage.thumbnails).forEach(url => resourceTracker.addResource(url as string));
      } else if (contentType === 'file' && contentItem instanceof File) {
        content = await uploadToS3(contentItem, contentType, accountId, 'original');
        metadata = {
          originalName: contentItem.name,
          size: contentItem.size,
          mimeType: contentItem.type
        };
        resourceTracker.addResource(content);
      } else if (contentType === 'link' || contentType === 'embed') {
        content = contentItem as string;
        metadata = {
          title: formData.get(`${contentType}Title-${index}`),
          description: formData.get(`${contentType}Description-${index}`)
        };
      } else {
        throw new Error(`Invalid content for type ${contentType}`);
      }

      await tx.insert(artifactContents).values({
        id: uuidv4(),
        accountId,
        artifactId,
        type: contentType,
        content,
        variants,
        metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: accountId,
        lastModifiedBy: accountId
      });

      index++;
    }
    return allContent;
  } catch (error) {
    // If an error occurs, rollback the uploads
    await resourceTracker.cleanup();
    throw error; // Re-throw the error after cleanup
  }
}