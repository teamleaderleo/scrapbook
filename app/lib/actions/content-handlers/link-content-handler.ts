import { ContentMetadataSchema } from '../../definitions/definitions';
import { z } from 'zod';

export async function processLinkContent(
  accountId: string,
  contentItem: string,
  contentId: string | null,
  index: number,
  formData: FormData
): Promise<{
  contentType: 'link';
  content: string;
  contentId: string | null;
  metadata: z.infer<typeof ContentMetadataSchema>;
}> {
  const orderStr = formData.get(`order-${index}`) as string;
  const order = isNaN(parseInt(orderStr, 10)) ? 0 : parseInt(orderStr, 10);

  const metadata = ContentMetadataSchema.parse({
    type: 'link',
    order,
    title: formData.get(`linkTitle-${index}`) as string,
    description: formData.get(`linkDescription-${index}`) as string,
    previewImage: formData.get(`linkPreviewImage-${index}`) as string,
  });

  return { 
    contentType: 'link', 
    content: contentItem, 
    contentId, 
    metadata 
  };
}