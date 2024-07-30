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

export async function handleContentUpdate(accountId: string, artifactId: string, formData: FormData): Promise<{ shouldDelete: boolean; newContentCount: number }> {
  const existingContents = await fetchExistingContents(accountId, artifactId);
  const existingContentIds = new Set(existingContents.map(row => row.id));
  let newContentCount = 0;

  let index = 0;
  while (formData.get(`contentType-${index}`) !== null) {
    const { contentType, content, contentId, metadata } = await processContentItem(accountId, formData, index);

    if (content) {
      if (contentId) {
        await updateExistingContent(accountId, contentId, contentType, content, metadata);
        existingContentIds.delete(contentId);
      } else {
        await insertNewContent(accountId, artifactId, contentType, content, metadata);
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
  metadata: z.infer<typeof ContentMetadataSchema>;
}> {
  const contentType = formData.get(`contentType-${index}`) as ContentType;
  const contentItem = formData.get(`content-${index}`);
  const contentId = formData.get(`contentId-${index}`) as string | null;
  const order = parseInt(formData.get(`order-${index}`) as string, 10);

  let metadata: z.infer<typeof ContentMetadataSchema>;

  switch (contentType) {
    case 'image':
      if (!(contentItem instanceof File)) {
        throw new Error(`Invalid image content`);
      }
      const processedImage = await processAndUploadImage(contentItem, accountId);
      metadata = ContentMetadataSchema.parse({
        type: 'image',
        order,
        variations: processedImage.variations
      });
      return { contentType, content: processedImage.compressed, contentId, metadata };

    case 'file':
      if (!(contentItem instanceof File)) {
        throw new Error(`Invalid file content`);
      }
      const fileUrl = await uploadToS3(contentItem, contentType, accountId, 'original');
      metadata = ContentMetadataSchema.parse({
        type: 'file',
        order,
      });
      return { contentType, content: fileUrl, contentId, metadata };

    case 'link':
      metadata = ContentMetadataSchema.parse({
        type: 'link',
        order,
        title: formData.get(`linkTitle-${index}`) as string,
        description: formData.get(`linkDescription-${index}`) as string,
        previewImage: formData.get(`linkPreviewImage-${index}`) as string,
      });
      return { contentType, content: contentItem as string, contentId, metadata };

    case 'text':
      metadata = ContentMetadataSchema.parse({
        type: 'text',
        order,
      });
      return { contentType, content: (contentItem as string).trim(), contentId, metadata };

    default:
      throw new Error(`Invalid content type: ${contentType}`);
  }
}

async function updateExistingContent(
  accountId: string, 
  contentId: string, 
  contentType: ContentType, 
  content: string, 
  metadata: z.infer<typeof ContentMetadataSchema>
): Promise<void> {
  const existingContent = await db.select().from(artifactContents).where(and(eq(artifactContents.id, contentId), eq(artifactContents.accountId, accountId))).limit(1);
  
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

async function insertNewContent(
  accountId: string, 
  artifactId: string, 
  contentType: ContentType, 
  content: string, 
  metadata: z.infer<typeof ContentMetadataSchema>
): Promise<void> {
  await db.insert(artifactContents).values({
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

export async function deleteRemovedContents(accountId: string, existingContents: ArtifactContent[], existingContentIds: Set<string>): Promise<void> {
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

      if (contentType === 'text') {
        allContent += content + ' ';
      }

      if (contentType === 'image') {
        const imageMetadata = metadata as z.infer<typeof ContentMetadataSchema> & { type: 'image' };
        Object.values(imageMetadata.variations || {}).forEach(url => {
          if (url) resourceTracker.addResource(url);
        });
      } else if (contentType === 'file') {
        resourceTracker.addResource(content);
      } else if (contentType === 'link') {
        const linkMetadata = metadata as z.infer<typeof ContentMetadataSchema> & { type: 'link' };
        if (linkMetadata.previewImage) {
          resourceTracker.addResource(linkMetadata.previewImage);
        }
      }

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

      index++;
    }
    return allContent;
  } catch (error) {
    await resourceTracker.cleanup();
    throw error;
  }
}