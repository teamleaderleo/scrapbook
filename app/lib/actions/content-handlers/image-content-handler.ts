import { processAndUploadImage } from '../../image-processing/image-processing';
import { ArtifactContentSchema, ArtifactContent } from '../../definitions/definitions';
import { S3ResourceTracker } from '../../external/s3-resource-tracker';
import { insertNewContent } from '../artifact-content-actions';

export async function processImageContent(
  accountId: string,
  contentItem: File,
  contentId: string | null,
  index: number,
  formData: FormData
): Promise<ArtifactContent> {
  if (!(contentItem instanceof File)) {
    throw new Error(`Invalid image content`);
  }
  const processedImage = await processAndUploadImage(contentItem, accountId);
  const orderStr = formData.get(`order-${index}`) as string;
  const order = isNaN(parseInt(orderStr, 10)) ? 0 : parseInt(orderStr, 10);

  return ArtifactContentSchema.parse({
    type: 'image',
    content: processedImage.compressed,
    contentId,
    metadata: {
      order,
      variations: processedImage.variations,
      dominantColors: processedImage.dominantColors
    }
  });
}

export async function insertImageContent(
  tx: any,
  accountId: string,
  artifactId: string,
  content: ArtifactContent,
  resourceTracker: S3ResourceTracker
): Promise<void> {
  if (content.type !== 'image') throw new Error('Invalid content type');
  
  Object.values(content.metadata.variations ?? {}).forEach(url => {
    if (url) resourceTracker.addResource(url);
  });

  await insertNewContent(tx, accountId, artifactId, content);
}