import { pgTable, uuid, text, varchar, timestamp, jsonb, foreignKey } from 'drizzle-orm/pg-core';

export const accounts = pgTable('account', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
});

export const tags = pgTable('tag', {
  id: uuid('id').primaryKey(),
  accountId: uuid('account_id').notNull().references(() => accounts.id),
  name: text('name').notNull(),
});

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
  type: text('type').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const projectTags = pgTable('project_tag', {
  accountId: uuid('account_id').notNull().references(() => accounts.id),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  tagId: uuid('tag_id').notNull().references(() => tags.id),
}, (t) => ({
  pk: foreignKey({ columns: [t.accountId, t.projectId, t.tagId], foreignColumns: [accounts.id, projects.id, tags.id] }).primaryKey(),
}));

export const artifactTags = pgTable('artifact_tag', {
  accountId: uuid('account_id').notNull().references(() => accounts.id),
  artifactId: uuid('artifact_id').notNull().references(() => artifacts.id),
  tagId: uuid('tag_id').notNull().references(() => tags.id),
}, (t) => ({
  pk: foreignKey({ columns: [t.accountId, t.artifactId, t.tagId], foreignColumns: [accounts.id, artifacts.id, tags.id] }).primaryKey(),
}));

export const projectArtifactLinks = pgTable('project_artifact_link', {
  accountId: uuid('account_id').notNull().references(() => accounts.id),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  artifactId: uuid('artifact_id').notNull().references(() => artifacts.id),
  addedAt: timestamp('added_at').notNull().defaultNow(),
}, (t) => ({
  pk: foreignKey({ columns: [t.accountId, t.projectId, t.artifactId], foreignColumns: [accounts.id, projects.id, artifacts.id] }).primaryKey(),
}));