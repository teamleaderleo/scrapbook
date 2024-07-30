import sharp from 'sharp';
import { uploadToS3, deleteFromS3 } from '../external/s3-operations';
import { ArtifactContent } from '../definitions/definitions';
import { z } from 'zod';
import { getPalette } from 'node-vibrant';

async function extractDominantColors(buffer: Buffer): Promise<string[]> {
  const palette = await getPalette(buffer, 5);
  return palette.map((color: { getHex: () => any; }) => color.getHex());
}

interface ThumbnailConfig {
  [key: string]: { width: number; height: number };
}

export const THUMBNAIL_CONFIGS: ThumbnailConfig = {
  small: { width: 40, height: 40 },
  medium: { width: 200, height: 200 },
  large: { width: 400, height: 400 },
};

const STORE_ORIGINAL = process.env.STORE_ORIGINAL_IMAGES === 'true';

export async function processAndUploadImage(
  file: File | Buffer, 
  accountId: string, 
  existingVersions?: ArtifactContent & { type: 'image' }
): Promise<{
  compressed: string;
  variations: Record<string, string>;
  dominantColors: string[];
}> {
  const fileBuffer = file instanceof File ? await file.arrayBuffer() : file;

  // Delete existing versions if present
  if (existingVersions && existingVersions.metadata.variations) {
    await deleteAllImageVersions(existingVersions.metadata.variations);
  }

  const compressedImage = await sharp(fileBuffer).webp({ quality: 60 }).toBuffer();
  const dominantColors = await extractDominantColors(Buffer.from(fileBuffer));

  const variations: Record<string, string> = {};
  for (const [size, dimensions] of Object.entries(THUMBNAIL_CONFIGS)) {
    const thumbnailBuffer = await sharp(fileBuffer)
      .resize(dimensions.width, dimensions.height, { fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer();
    variations[size] = await uploadToS3(thumbnailBuffer, 'image/webp', accountId, `thumbnail_${size}`);
  }

  const compressedUrl = await uploadToS3(compressedImage, 'image/webp', accountId, 'compressed');
  variations['compressed'] = compressedUrl;

  if (STORE_ORIGINAL) {
    const originalImage = await sharp(fileBuffer).webp({ quality: 90 }).toBuffer();
    variations['original'] = await uploadToS3(originalImage, 'image/webp', accountId, 'original');
  }

  return {
    compressed: compressedUrl,
    variations,
    dominantColors
  };
}

export async function deleteAllImageVersions(variations: Record<string, string>): Promise<void> {
  const urls = Object.values(variations);
  await Promise.all(urls.filter(Boolean).map(url => deleteFromS3(url)));
}