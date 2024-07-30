import { uploadToS3 } from '../../external/s3-operations';
import { ArtifactContent, ArtifactContentSchema } from '../../definitions/definitions';
import { S3ResourceTracker } from '../../external/s3-resource-tracker';
import { insertNewContent } from '../artifact-content-actions';

export async function processFileContent(
  accountId: string,
  contentItem: File,
  contentId: string | null,
  index: number,
  formData: FormData
): Promise<ArtifactContent> {
  if (!(contentItem instanceof File)) {
    throw new Error(`Invalid file content`);
  }
  const fileUrl = await uploadToS3(contentItem, 'file', accountId, 'original');
  const orderStr = formData.get(`order-${index}`) as string;
  const order = isNaN(parseInt(orderStr, 10)) ? 0 : parseInt(orderStr, 10);

  return ArtifactContentSchema.parse({
    type: 'file',
    content: fileUrl,
    id: contentId || undefined,
    accountId,
    artifactId: formData.get('artifactId') as string,
    metadata: {
      order,
      originalName: contentItem.name,
      size: contentItem.size,
      mimeType: contentItem.type,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: accountId,
    lastModifiedBy: accountId,
  });
}

export async function insertFileContent(
  tx: any,
  accountId: string,
  artifactId: string,
  content: ArtifactContent,
  resourceTracker: S3ResourceTracker
): Promise<void> {
  if (content.type !== 'file') throw new Error('Invalid content type');
  resourceTracker.addResource(content.content);
  await insertNewContent(tx, accountId, artifactId, content);
}