import { pgTable, pgView, uuid, text, varchar, timestamp, integer, serial, uniqueIndex, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { eq, sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { Tag, } from '../definitions/definitions';
import { Artifact } from '../definitions/artifact-definitions';
import { z } from 'zod';
import { AnnotationSchema, ContentVariantSchema, EmbedDataSchema } from './zod-schemas';

export const contentTypeEnum = pgEnum('content_type', ['text', 'longText', 'image', 'file', 'link', 'embed']);

export const accounts = pgTable('account', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  password: text('password'),
  provider: varchar('provider', { length: 255 }),
  providerAccountId: varchar('provider_account_id', { length: 255 }),
  lastLogin: timestamp('last_login'),
}, (table) => ({
  emailIndex: uniqueIndex('users_email_key').on(table.email),
}));

export const tags = pgTable('tag', {
  id: uuid('id').primaryKey(),
  accountId: uuid('account_id').notNull().references(() => accounts.id),
  name: text('name').notNull(),
}, (table) => ({
  accountNameIndex: uniqueIndex('tag_account_id_name_key').on(table.accountId, table.name),
}));

export const projects = pgTable('project', {
  id: uuid('id').primaryKey(),
  accountId: uuid('account_id').notNull().references(() => accounts.id),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  status: text('status').notNull(),
});

export const artifacts = pgTable('artifact', {
  id: uuid('id').primaryKey(),
  accountId: uuid('account_id').notNull().references(() => accounts.id),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const artifactContents = pgTable('artifact_content', {
  id: uuid('id').primaryKey(),
  accountId: uuid('account_id').notNull().references(() => accounts.id),
  artifactId: uuid('artifact_id').notNull().references(() => artifacts.id),
  type: contentTypeEnum('type').notNull(),
  content: text('content').notNull(),
  variants: jsonb('variants'),
  metadata: jsonb('metadata'),
  embed: jsonb('embed'),
  annotations: jsonb('annotations'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => accounts.id),
  lastModifiedBy: uuid('last_modified_by').references(() => accounts.id),
});

export const projectTags = pgTable('project_tag', {
  accountId: uuid('account_id').notNull().references(() => accounts.id),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  tagId: uuid('tag_id').notNull().references(() => tags.id),
}, (table) => ({
  projectTagIndex: uniqueIndex('project_tag_project_id_tag_id_key').on(table.projectId, table.tagId),
}));

export const artifactTags = pgTable('artifact_tag', {
  accountId: uuid('account_id').notNull().references(() => accounts.id),
  artifactId: uuid('artifact_id').notNull().references(() => artifacts.id),
  tagId: uuid('tag_id').notNull().references(() => tags.id),
}, (table) => ({
  artifactTagIndex: uniqueIndex('artifact_tag_artifact_id_tag_id_key').on(table.artifactId, table.tagId),
}));

export const projectArtifactLinks = pgTable('project_artifact_link', {
  accountId: uuid('account_id').notNull().references(() => accounts.id),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  artifactId: uuid('artifact_id').notNull().references(() => artifacts.id),
  addedAt: timestamp('added_at').notNull().defaultNow(),
});

export const s3Usage = pgTable('s3_usage', {
  id: serial('id').primaryKey(),
  accountId: uuid('account_id').notNull().references(() => accounts.id),
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  count: integer('count').notNull().default(0),
}, (table) => ({
  accountMonthYearIndex: uniqueIndex('s3_usage_account_id_month_year_key').on(table.accountId, table.month, table.year),
}));

export const insertArtifactContentSchema = createInsertSchema(artifactContents, {
  variants: z.array(ContentVariantSchema).optional(),
  metadata: z.record(z.unknown()).optional(),
  embed: EmbedDataSchema.optional(),
  annotations: z.array(AnnotationSchema).optional(),
});

export const selectArtifactSchema = createSelectSchema(artifacts);
export const selectArtifactContentSchema = createSelectSchema(artifactContents, {
  variants: z.array(ContentVariantSchema).nullable(),
  metadata: z.record(z.unknown()).nullable(),
  embed: EmbedDataSchema.nullable(),
  annotations: z.array(AnnotationSchema).nullable(),
});
export const selectProjectSchema = createSelectSchema(projects);
export const selectTagSchema = createSelectSchema(tags);

export const projectWithArtifactsView = pgView("project_with_artifacts_view").as((qb) => {
  return qb
    .select({
      id: projects.id,
      accountId: projects.accountId,
      name: projects.name,
      description: projects.description,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      status: projects.status,
      tagId: tags.id,
      tagName: tags.name,
      artifactId: artifacts.id,
      artifactName: artifacts.name,
      artifactDescription: artifacts.description,
      artifactCreatedAt: artifacts.createdAt,
      artifactUpdatedAt: artifacts.updatedAt,
      contentId: artifactContents.id,
      contentType: artifactContents.type,
      content: artifactContents.content,
      contentVariants: artifactContents.variants,
      contentMetadata: artifactContents.metadata,
      contentEmbed: artifactContents.embed,
      contentAnnotations: artifactContents.annotations,
      contentCreatedAt: artifactContents.createdAt,
      contentUpdatedAt: artifactContents.updatedAt,
      contentCreatedBy: artifactContents.createdBy,
      contentLastModifiedBy: artifactContents.lastModifiedBy,
    })
    .from(projects)
    .leftJoin(projectTags, eq(projects.id, projectTags.projectId))
    .leftJoin(tags, eq(projectTags.tagId, tags.id))
    .leftJoin(projectArtifactLinks, eq(projects.id, projectArtifactLinks.projectId))
    .leftJoin(artifacts, eq(projectArtifactLinks.artifactId, artifacts.id))
    .leftJoin(artifactContents, eq(artifacts.id, artifactContents.artifactId));
});

