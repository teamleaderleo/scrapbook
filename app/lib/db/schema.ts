import { pgTable, pgView, uuid, text, varchar, timestamp, integer, serial, uniqueIndex, jsonb, pgEnum, index } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm'

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
}, (table) => ({
  accountUpdatedIndex: index('idx_projects_account_updated').on(table.accountId, table.updatedAt),
  nameIndex: index('idx_projects_name').on(table.name),
}));

export const blocks = pgTable('block', {
  id: uuid('id').primaryKey(),
  accountId: uuid('account_id').notNull().references(() => accounts.id),
  content: jsonb('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => accounts.id),
  lastModifiedBy: uuid('last_modified_by').references(() => accounts.id),
  x: integer('x').default(0),
  y: integer('y').default(0),
  width: integer('width').default(1),
  height: integer('height').default(1),
  order: integer('order'),
}, (table) => ({
  accountUpdatedIndex: index('idx_blocks_account_updated').on(table.accountId, table.updatedAt),
}));

export const tagAssociations = pgTable('tag_association', {
  id: uuid('id').primaryKey(),
  accountId: uuid('account_id').notNull().references(() => accounts.id),
  tagId: uuid('tag_id').notNull().references(() => tags.id),
  associatedId: uuid('associated_id').notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  order: integer('order'),
}, (table) => ({
  uniqueAssociation: uniqueIndex('unique_tag_association').on(table.accountId, table.tagId, table.associatedId),
  entityTypeIndex: index('idx_tag_associations_entity').on(table.entityType, table.associatedId, table.accountId),
  tagIdIndex: index('idx_tag_associations_tag_id').on(table.tagId),
}));

export const projectBlockLinks = pgTable('project_block_link', {
  accountId: uuid('account_id').notNull().references(() => accounts.id),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  blockId: uuid('block_id').notNull().references(() => blocks.id),
  addedAt: timestamp('added_at').notNull().defaultNow(),
}, (table) => ({
  projectBlockIndex: index('idx_project_block_links').on(table.projectId, table.blockId, table.accountId),
  blockIndex: index('idx_project_block_links_block').on(table.blockId),
  projectIndex: index('idx_project_block_links_project').on(table.projectId),
}));

export const s3Usage = pgTable('s3_usage', {
  id: serial('id').primaryKey(),
  accountId: uuid('account_id').notNull().references(() => accounts.id),
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  count: integer('count').notNull().default(0),
}, (table) => ({
  accountMonthYearIndex: uniqueIndex('s3_usage_account_id_month_year_key').on(table.accountId, table.month, table.year),
}));