import { z } from 'zod';
import { ContentType } from '../definitions/definitions';

export const ContentVariantSchema = z.object({
  url: z.string().url(),
  type: z.nativeEnum(ContentType)
});

export const EmbedDataSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  thumbnailUrl: z.string().url().optional(),
  authorName: z.string().optional(),
  authorUrl: z.string().url().optional(),
  providerName: z.string().optional(),
  providerUrl: z.string().url().optional()
});

export const AnnotationSchema = z.object({
  id: z.string(),
  content: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const ImageVersionsSchema = z.object({
  original: z.string().url(),
  compressed: z.string().url(),
  thumbnails: z.record(z.string().url())
});