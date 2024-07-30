import { processAndUploadImage } from '../../image-processing/image-processing';
import { ContentMetadataSchema } from '../../definitions/definitions';
import { z } from 'zod';
import { artifactContents } from '../../db/schema';
import { S3ResourceTracker } from '../../external/s3-resource-tracker';
import { v4 as uuidv4 } from 'uuid';

export async function processImageContent(
  accountId: string,
  contentItem: File,
  contentId: string | null,
  index: number,
  formData: FormData
): Promise<{
  contentType: 'image';
  content: string;
  contentId: string | null;
  metadata: z.infer<typeof ContentMetadataSchema>;
}> {
  if (!(contentItem instanceof File)) {
    throw new Error(`Invalid image content`);
  }
  const processedImage = await processAndUploadImage(contentItem, accountId);
  const orderStr = formData.get(`order-${index}`) as string;
  const order = isNaN(parseInt(orderStr, 10)) ? 0 : parseInt(orderStr, 10);

  const metadata = ContentMetadataSchema.parse({
    type: 'image',
    order,
    variations: processedImage.variations
  });

  return { 
    contentType: 'image', 
    content: processedImage.compressed, 
    contentId, 
    metadata 
  };
}

export async function insertImageContent(
  tx: any,
  accountId: string,
  artifactId: string,
  content: string,
  metadata: z.infer<typeof ContentMetadataSchema>,
  resourceTracker: S3ResourceTracker
): Promise<void> {
  const imageMetadata = metadata as z.infer<typeof ContentMetadataSchema> & { type: 'image' };
  Object.values(imageMetadata.variations || {}).forEach(url => {
    if (url) resourceTracker.addResource(url);
  });

  await tx.insert(artifactContents).values({
    id: uuidv4(),
    accountId,
    artifactId,
    type: 'image',
    content,
    metadata: imageMetadata,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: accountId,
    lastModifiedBy: accountId
  });
}