import { uploadToS3 } from '../../external/s3-operations';
import { ContentMetadataSchema } from '../../definitions/definitions';
import { z } from 'zod';

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