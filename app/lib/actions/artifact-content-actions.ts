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
): Promise<{ shouldDeleteArtifact: boolean; newContentCount: number }> {
  let newContentCount = 0;
// delete the stuff that is not in the new list
// do we want to mark for deletion on the front end?
  for (const content of contents) {
    if (content.content) {
      if (content.id) {
        await updateExistingContent(tx, accountId, content);
        delete(content.id);
      } else {
        await insertNewContent(tx, accountId, artifactId, content);
      }
      newContentCount++;
    } else if (content.id) {
      delete(content.id);
    }
  }

  await deleteRemovedContents(tx, accountId, existingContents, existingContentIds);

  return { shouldDeleteArtifact: newContentCount === 0, newContentCount };
}

async function updateExistingContent(
  tx: any,
  accountId: string, 
  content: ArtifactFormSubmission['contents'][number]
): Promise<void> {
  
  if (content.type === 'image' && content.type === 'image') {
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

export async function deleteContent(
  tx: any,
  accountId: string,
  artifactId: string,
  contentId: string
): Promise<void> {
  await tx.delete(artifactContents)
    .where(and(
      eq(artifactContents.id, contentId),
      eq(artifactContents.accountId, accountId),
      eq(artifactContents.artifactId, artifactId)
    ));
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