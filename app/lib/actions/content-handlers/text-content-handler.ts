import { ContentMetadataSchema } from '../../definitions/definitions';
import { z } from 'zod';

export async function processTextContent(
  accountId: string,
  contentItem: string,
  contentId: string | null,
  index: number,
  formData: FormData
): Promise<{
  contentType: 'text';
  content: string;
  contentId: string | null;
  metadata: z.infer<typeof ContentMetadataSchema>;
}> {
  const orderStr = formData.get(`order-${index}`) as string;
  const order = isNaN(parseInt(orderStr, 10)) ? 0 : parseInt(orderStr, 10);

  const metadata = ContentMetadataSchema.parse({
    type: 'text',
    order,
  });

  return { 
    contentType: 'text', 
    content: contentItem.trim(), 
    contentId, 
    metadata 
  };
}