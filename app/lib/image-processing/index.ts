import sharp from 'sharp';
import { v4 as uuid } from 'uuid';
import { uploadToS3 } from '../external/s3-operations';

interface ProcessedImage {
  original: string;
  thumbnail: string;
  compressed: string;
}

export async function processAndUploadImage(
  file: File | Buffer,
  accountId: string
): Promise<ProcessedImage> {
  const fileBuffer = file instanceof File ? await file.arrayBuffer() : file;
  const fileName = `${uuid()}`;

  // Process original image
  const originalImage = await sharp(fileBuffer)
    .webp({ quality: 90 })
    .toBuffer();

  // Create thumbnail
  const thumbnailImage = await sharp(fileBuffer)
    .resize(200, 200, { fit: 'inside' })
    .webp({ quality: 80 })
    .toBuffer();

  // Create compressed version
  const compressedImage = await sharp(fileBuffer)
    .webp({ quality: 60 })
    .toBuffer();

  // Upload all versions to S3
  const [originalUrl, thumbnailUrl, compressedUrl] = await Promise.all([
    uploadToS3(originalImage, 'image/webp', accountId),
    uploadToS3(thumbnailImage, 'image/webp', accountId),
    uploadToS3(compressedImage, 'image/webp', accountId)
  ]);

  return {
    original: originalUrl,
    thumbnail: thumbnailUrl,
    compressed: compressedUrl
  };
}

export async function createPlaceholder(file: File | Buffer): Promise<string> {
  const fileBuffer = file instanceof File ? await file.arrayBuffer() : file;
  
  const placeholderImage = await sharp(fileBuffer)
    .resize(10, 10, { fit: 'inside' })
    .blur()
    .webp({ quality: 20 })
    .toBuffer();

  return `data:image/webp;base64,${placeholderImage.toString('base64')}`;
}