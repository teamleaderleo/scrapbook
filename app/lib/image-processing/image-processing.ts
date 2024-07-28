import sharp from 'sharp';
import { uploadToS3, deleteFromS3 } from '../external/s3-operations';
import { ImageVersions } from '../definitions/definitions';

interface ThumbnailConfig {
  [key: string]: { width: number; height: number };
}

const THUMBNAIL_CONFIGS: ThumbnailConfig = {
  small: { width: 40, height: 40 },
  medium: { width: 200, height: 200 },
  large: { width: 400, height: 400 },
};

const STORE_ORIGINAL = process.env.STORE_ORIGINAL_IMAGES === 'true';

export async function processAndUploadImage(
  file: File | Buffer, 
  accountId: string, 
  existingVersions?: ImageVersions
): Promise<ImageVersions> {
  const fileBuffer = file instanceof File ? await file.arrayBuffer() : file;

  // Delete existing versions if present
  if (existingVersions) {
    await deleteAllImageVersions(existingVersions);
  }

  const compressedImage = await sharp(fileBuffer).webp({ quality: 60 }).toBuffer();

  const thumbnails: { [key: string]: string } = {};
  for (const [size, dimensions] of Object.entries(THUMBNAIL_CONFIGS)) {
    const thumbnailBuffer = await sharp(fileBuffer)
      .resize(dimensions.width, dimensions.height, { fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer();
    thumbnails[size] = await uploadToS3(thumbnailBuffer, 'image/webp', accountId, `thumbnail_${size}`);
  }

  const compressedUrl = await uploadToS3(compressedImage, 'image/webp', accountId, 'compressed');

  let originalUrl = '';
  if (STORE_ORIGINAL) {
    const originalImage = await sharp(fileBuffer).webp({ quality: 90 }).toBuffer();
    originalUrl = await uploadToS3(originalImage, 'image/webp', accountId, 'original');
  }

  return {
    original: originalUrl,
    compressed: compressedUrl,
    thumbnails
  };
}

export async function deleteAllImageVersions(versions: ImageVersions): Promise<void> {
  const urls = [
    versions.original,
    versions.compressed,
    ...Object.values(versions.thumbnails || {})
  ];
  await Promise.all(urls.filter(Boolean).map(url => deleteFromS3(url)));
}