import { processAndUploadImage } from '../../image-processing/image-processing';
import { ContentMetadataSchema } from '../../definitions/definitions';
import { z } from 'zod';

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