import { ArtifactFormSubmission, ArtifactContent, ArtifactContentSchema } from "../../definitions/definitions";
import { uploadToS3 } from "../../external/s3-operations";
import { S3ResourceTracker } from "../../external/s3-resource-tracker";
import { insertNewContent } from "../artifact-content-actions";

export async function processFileContent(
  accountId: string,
  content: ArtifactFormSubmission['contents'][number]
): Promise<ArtifactContent> {
  if (!(content.content instanceof Blob)) {
    throw new Error(`Invalid file content`);
  }
  const fileUrl = await uploadToS3(content.content, 'file', accountId, 'original');

  return ArtifactContentSchema.parse({
    type: 'file',
    content: fileUrl,
    id: content.id,
    accountId,
    artifactId: content.artifactId,
    metadata: {
      order: content.metadata.order,
      originalName: content.content.name,
      size: content.content.size,
      mimeType: content.content.type,
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
  content: ArtifactFormSubmission['contents'][number],
  resourceTracker: S3ResourceTracker
): Promise<void> {
  if (content.type !== 'file') throw new Error('Invalid content type');
  const processedContent = await processFileContent(accountId, content);
  resourceTracker.addResource(processedContent.content);
  await insertNewContent(tx, accountId, artifactId, processedContent);
}