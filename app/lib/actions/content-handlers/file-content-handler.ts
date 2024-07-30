import { uploadToS3 } from '../../external/s3-operations';
import { ContentMetadataSchema } from '../../definitions/definitions';
import { z } from 'zod';
import { artifactContents } from '../../db/schema';
import { S3ResourceTracker } from '../../external/s3-resource-tracker';
import { v4 as uuidv4 } from 'uuid';
import { insertNewContent } from '../artifact-content-actions';

export async function processFileContent(
  accountId: string,
  contentItem: File,
  contentId: string | null,
  index: number,
  formData: FormData
): Promise<{
  contentType: 'file';
  content: string;
  contentId: string | null;
  metadata: z.infer<typeof ContentMetadataSchema>;
}> {
  if (!(contentItem instanceof File)) {
    throw new Error(`Invalid file content`);
  }
  const fileUrl = await uploadToS3(contentItem, 'file', accountId, 'original');
  const orderStr = formData.get(`order-${index}`) as string;
  const order = isNaN(parseInt(orderStr, 10)) ? 0 : parseInt(orderStr, 10);

  const metadata = ContentMetadataSchema.parse({
    type: 'file',
    order,
  });

  return { 
    contentType: 'file', 
    content: fileUrl, 
    contentId, 
    metadata 
  };
}

export async function insertFileContent(
  tx: any,
  accountId: string,
  artifactId: string,
  content: string,
  metadata: z.infer<typeof ContentMetadataSchema>,
  resourceTracker: S3ResourceTracker
): Promise<void> {
  resourceTracker.addResource(content);

  await insertNewContent(tx, accountId, artifactId, 'file', content, metadata);
}