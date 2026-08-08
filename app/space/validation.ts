import { z } from 'zod';

const nullableUrlSchema = z
  .union([
    z.string().trim().max(2_048, 'URL is too long').url('URL must be valid'),
    z.literal('').transform(() => null),
    z.null(),
  ])
  .optional();

const versionSchema = z.object({
  label: z.string().trim().min(1, 'Each version needs a label').max(80),
  content: z.string().max(200_000, 'Version content is too large'),
  code: z.string().max(200_000, 'Version code is too large').nullable(),
});

const editableItemFields = {
  slug: z
    .string()
    .trim()
    .min(1, 'Slug is required')
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must use lowercase kebab-case'),
  title: z.string().trim().min(1, 'Title is required').max(300),
  url: nullableUrlSchema,
  tags: z.array(z.string().trim().min(1).max(100)).max(100).optional(),
  category: z.string().trim().min(1).max(100).nullable().optional(),
  defaultIndex: z.number().int().nonnegative().optional(),
  versions: z
    .array(versionSchema)
    .min(1, 'At least one version is required')
    .max(50),
  score: z.number().int().min(0).max(100).nullable().optional(),
};

function defaultIndexExists(
  value: { defaultIndex?: number; versions?: Array<unknown> },
  context: z.RefinementCtx
) {
  if (
    value.defaultIndex !== undefined &&
    value.versions &&
    value.defaultIndex >= value.versions.length
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Default version must refer to an existing version',
      path: ['defaultIndex'],
    });
  }
}

export const itemIdSchema = z.string().uuid('Item ID must be a UUID');

export const addItemSchema = z
  .object(editableItemFields)
  .strict()
  .superRefine(defaultIndexExists);

export const updateItemSchema = z
  .object({
    slug: editableItemFields.slug.optional(),
    title: editableItemFields.title.optional(),
    url: editableItemFields.url,
    tags: editableItemFields.tags,
    category: editableItemFields.category,
    defaultIndex: editableItemFields.defaultIndex,
    versions: editableItemFields.versions.optional(),
    score: editableItemFields.score,
  })
  .strict()
  .refine(
    value => Object.keys(value).length > 0,
    'At least one field must be updated'
  )
  .refine(
    value =>
      (value.defaultIndex === undefined) === (value.versions === undefined),
    'Versions and their default selection must be updated together'
  )
  .superRefine(defaultIndexExists);

export const reviewRatingSchema = z.number().int().min(1).max(4);

export type AddItemInput = z.input<typeof addItemSchema>;
export type UpdateItemInput = z.input<typeof updateItemSchema>;
