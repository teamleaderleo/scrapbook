import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { CloudFrontClient, CreateInvalidationCommand } from "@aws-sdk/client-cloudfront";
import { v4 as uuid } from 'uuid';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/db';
import { s3Usage } from '../db/schema';
import FileType from 'file-type';
import { fileTypeFromBuffer } from 'file-type';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const cloudFrontClient = new CloudFrontClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const MONTHLY_UPLOAD_LIMIT = 50; // Adjustable
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  // Idk what else to allow
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

async function checkAndUpdateS3Usage(accountId: string): Promise<boolean> {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const result = await db.select()
    .from(s3Usage)
    .where(and(
      eq(s3Usage.accountId, accountId),
      eq(s3Usage.month, currentMonth),
      eq(s3Usage.year, currentYear)
    ))
    .limit(1);

  if (result.length === 0) {
    await db.insert(s3Usage).values({
      accountId,
      month: currentMonth,
      year: currentYear,
      count: 1
    });
    return true;
  }

  const currentCount = result[0].count;

  if (currentCount >= MONTHLY_UPLOAD_LIMIT) {
    return false;
  }

  await db.update(s3Usage)
    .set({ count: currentCount + 1 })
    .where(and(
      eq(s3Usage.accountId, accountId),
      eq(s3Usage.month, currentMonth),
      eq(s3Usage.year, currentYear)
    ));

  return true;
}

async function validateFile(file: File | Buffer): Promise<boolean> {
  // Check file size
  const fileSize = file instanceof File ? file.size : file.length;
  if (fileSize > MAX_FILE_SIZE) {
    throw new Error('File size exceeds the maximum limit');
  }

  // Check file type
  const fileBuffer = file instanceof File ? await file.arrayBuffer() : file;
  const fileType = await fileTypeFromBuffer(Buffer.from(fileBuffer));

  if (!fileType || !ALLOWED_MIME_TYPES.includes(fileType.mime)) {
    throw new Error('Invalid file type');
  }

  return true;
}

export async function uploadToS3(file: File | Buffer, contentType: string, accountId: string, version: string): Promise<string> {
  if (!(await checkAndUpdateS3Usage(accountId))) {
    throw new Error('Monthly S3 upload limit reached');
  }

  await validateFile(file);

  const fileBuffer = file instanceof File ? await file.arrayBuffer() : file;
  const fileName = `${uuid()}-${file instanceof File ? file.name : 'file'}`;
  const key = `users/${accountId}/${version}/${fileName}`;

  const uploadParams = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
    Body: Buffer.from(fileBuffer),
    ContentType: contentType,
  };

  try {
    await s3Client.send(new PutObjectCommand(uploadParams));
    const cloudFrontDomain = process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN;
    const fileUrl = `${cloudFrontDomain}/${key}`;
    return fileUrl.startsWith('https://') ? fileUrl : `https://${fileUrl}`;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error('Failed to upload file to S3');
  }
}

export async function deleteFromS3(fileUrl: string): Promise<void> {
  const key = fileUrl.replace(`https://${process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN}/`, '');

  const deleteParams = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
  };

  try {
    await s3Client.send(new DeleteObjectCommand(deleteParams));
    // Invalidate CloudFront cache
    await cloudFrontClient.send(new CreateInvalidationCommand({
      DistributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
      InvalidationBatch: {
        CallerReference: `delete-${Date.now()}`,
        Paths: {
          Quantity: 1,
          Items: [`/${key}`],
        },
      },
    }));
  } catch (error) {
    console.error('Error deleting from S3 or invalidating CloudFront:', error);
    throw new Error('Failed to delete file from S3 or invalidate CloudFront');
  }
}

export function getCloudFrontUrl(key: string): string {
  const cloudFrontDomain = process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN;
  return `${cloudFrontDomain}/${key}`;
}