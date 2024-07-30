import { insertNewContent } from '../artifact-content-actions';
import { ArtifactContent, ArtifactContentSchema } from '../../definitions/definitions';

export async function processTextContent(
  accountId: string,
  contentItem: string,
  contentId: string | null,
  index: number,
  formData: FormData
): Promise<ArtifactContent> {
  const orderStr = formData.get(`order-${index}`) as string;
  const order = isNaN(parseInt(orderStr, 10)) ? 0 : parseInt(orderStr, 10);

  return ArtifactContentSchema.parse({
    type: 'text',
    content: contentItem.trim(),
    id: contentId || undefined,
    accountId,
    artifactId: formData.get('artifactId') as string,
    metadata: {
      order,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: accountId,
    lastModifiedBy: accountId,
  });
}

export async function insertTextContent(
  tx: any,
  accountId: string,
  artifactId: string,
  content: ArtifactContent
): Promise<void> {
  if (content.type !== 'text') throw new Error('Invalid content type');
  await insertNewContent(tx, accountId, artifactId, content);
}