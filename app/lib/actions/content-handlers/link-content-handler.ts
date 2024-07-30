import { insertNewContent } from '../artifact-content-actions';
import { ArtifactContent, ArtifactContentSchema } from '../../definitions/definitions';

export async function processLinkContent(
  accountId: string,
  contentItem: string,
  contentId: string | null,
  index: number,
  formData: FormData
): Promise<ArtifactContent> {
  const orderStr = formData.get(`order-${index}`) as string;
  const order = isNaN(parseInt(orderStr, 10)) ? 0 : parseInt(orderStr, 10);

  return ArtifactContentSchema.parse({
    type: 'link',
    content: contentItem,
    id: contentId || undefined,
    accountId,
    artifactId: formData.get('artifactId') as string,
    metadata: {
      order,
      title: formData.get(`linkTitle-${index}`) as string,
      description: formData.get(`linkDescription-${index}`) as string,
      previewImage: formData.get(`linkPreviewImage-${index}`) as string,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: accountId,
    lastModifiedBy: accountId,
  });
}

export async function insertLinkContent(
  tx: any,
  accountId: string,
  artifactId: string,
  content: ArtifactContent
): Promise<void> {
  if (content.type !== 'link') throw new Error('Invalid content type');
  await insertNewContent(tx, accountId, artifactId, content);
}