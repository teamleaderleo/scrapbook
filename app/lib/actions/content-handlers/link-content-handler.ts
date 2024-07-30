import { ContentMetadataSchema } from '../../definitions/definitions';
import { z } from 'zod';
import { insertNewContent } from '../artifact-content-actions';
import { artifactContents } from '../../db/schema';
import { v4 as uuidv4 } from 'uuid';


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

export async function insertLinkContent(
  tx: any,
  accountId: string,
  artifactId: string,
  content: string,
  metadata: z.infer<typeof ContentMetadataSchema>
): Promise<void> {
  await insertNewContent(tx, accountId, artifactId, 'link', content, metadata);
}