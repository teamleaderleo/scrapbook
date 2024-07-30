import { pgTable, pgView, uuid, text, varchar, timestamp, integer, serial, uniqueIndex, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { eq, sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

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
  type: varchar('type', { length: 255 }).notNull(),
  content: text('content').notNull(),
  metadata: jsonb('metadata'),
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
  metadata: z.record(z.unknown()).optional(),
});

export const selectArtifactSchema = createSelectSchema(artifacts);
export const selectArtifactContentSchema = createSelectSchema(artifactContents, {
  metadata: z.record(z.unknown()).nullable(),
});
export const selectProjectSchema = createSelectSchema(projects);
export const selectTagSchema = createSelectSchema(tags);

export const projectWithArtifactsView = pgView("project_with_artifacts_view").as((qb) => {
  const tagSubquery = qb
    .select({
      projectId: projectTags.projectId,
      tagArray: sql<string>`json_agg(distinct jsonb_build_object('id', ${tags.id}, 'name', ${tags.name}))`.as('tag_array'),
    })
    .from(projectTags)
    .leftJoin(tags, sql`${projectTags.tagId} = ${tags.id}`)
    .groupBy(projectTags.projectId)
    .as('tag_subquery');

  const contentSubquery = qb
    .select({
      artifactId: artifactContents.artifactId,
      contentArray: sql<string>`json_agg(distinct jsonb_build_object(
        'id', ${artifactContents.id},
        'type', ${artifactContents.type},
        'content', ${artifactContents.content},
        'metadata', ${artifactContents.metadata},
        'createdAt', ${artifactContents.createdAt},
        'updatedAt', ${artifactContents.updatedAt},
        'createdBy', ${artifactContents.createdBy},
        'lastModifiedBy', ${artifactContents.lastModifiedBy}
      ))`.as('content_array'),
    })
    .from(artifactContents)
    .groupBy(artifactContents.artifactId)
    .as('content_subquery');

  const artifactSubquery = qb
    .select({
      projectId: projectArtifactLinks.projectId,
      artifactArray: sql<string>`json_agg(distinct jsonb_build_object(
        'id', ${artifacts.id}, 
        'name', ${artifacts.name}, 
        'description', ${artifacts.description},
        'createdAt', ${artifacts.createdAt},
        'updatedAt', ${artifacts.updatedAt},
        'contents', coalesce(${contentSubquery.contentArray}, '[]'::json)
      ))`.as('artifact_array'),
    })
    .from(projectArtifactLinks)
    .leftJoin(artifacts, sql`${projectArtifactLinks.artifactId} = ${artifacts.id}`)
    .leftJoin(contentSubquery, sql`${artifacts.id} = ${contentSubquery.artifactId}`)
    .groupBy(projectArtifactLinks.projectId)
    .as('artifact_subquery');

  return qb
    .select({
      id: projects.id,
      accountId: projects.accountId,
      name: projects.name,
      description: projects.description,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      status: projects.status,
      tags: sql<string>`coalesce(${tagSubquery.tagArray}, '[]'::json)`.as('tags'),
      artifacts: sql<string>`coalesce(${artifactSubquery.artifactArray}, '[]'::json)`.as('artifacts'),
    })
    .from(projects)
    .leftJoin(tagSubquery, sql`${projects.id} = ${tagSubquery.projectId}`)
    .leftJoin(artifactSubquery, sql`${projects.id} = ${artifactSubquery.projectId}`);
});
