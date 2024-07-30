'use server';

import { eq, and } from 'drizzle-orm';
import {  ArtifactContentSchema, ArtifactFormSubmission, } from '../definitions/definitions';
import { ArtifactContent } from "../definitions/definitions";
import { deleteFromS3 } from '../external/s3-operations';
import { artifactContents } from '../db/schema';
import { v4 as uuidv4 } from 'uuid';
import { deleteAllImageVersions } from '../image-processing/image-processing';
import { S3ResourceTracker } from '../external/s3-resource-tracker';

import { insertImageContent } from './content-handlers/image-content-handler';
import { insertFileContent } from './content-handlers/file-content-handler';
import { insertLinkContent } from './content-handlers/link-content-handler';
import { insertTextContent } from './content-handlers/text-content-handler';

export async function handleContentUpdate(
  tx: any,
  accountId: string, 
  artifactId: string, 
  contents: ArtifactFormSubmission['contents']
): Promise<{ shouldDelete: boolean; newContentCount: number }> {
  const existingContents = await fetchExistingContents(tx, accountId, artifactId);
  const existingContentIds = new Set(existingContents.map(row => row.id));
  let newContentCount = 0;

  for (const content of contents) {
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

async function updateExistingContent(
  tx: any,
  accountId: string, 
  content: ArtifactFormSubmission['contents'][number]
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
      content: content.content instanceof Blob ? await content.content.text() : content.content,
      metadata: content.metadata,
      updatedAt: new Date(),
      lastModifiedBy: accountId
    })
    .where(and(
      eq(artifactContents.id, content.id!),
      eq(artifactContents.accountId, accountId)
    ));
}

export async function insertNewContent(
  tx: any,
  accountId: string, 
  artifactId: string, 
  content: ArtifactFormSubmission['contents'][number]
): Promise<void> {
  await tx.insert(artifactContents).values({
    id: content.id || uuidv4(),
    accountId,
    artifactId,
    type: content.type,
    content: content.content instanceof Blob ? await content.content.text() : content.content,
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

export async function insertContents(
  tx: any, 
  accountId: string, 
  artifactId: string, 
  contents: ArtifactFormSubmission['contents']
): Promise<string> {
  let allContent = '';
  const resourceTracker = new S3ResourceTracker();

  try {
    for (const content of contents) {
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
    }
    return allContent;
  } catch (error) {
    await resourceTracker.cleanup();
    throw error;
  }
}