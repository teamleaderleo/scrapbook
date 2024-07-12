import { pgTable, uniqueIndex, pgEnum, uuid, text, varchar, timestamp, foreignKey, serial, integer } from "drizzle-orm/pg-core"
  import { sql } from "drizzle-orm"

export const aal_level = pgEnum("aal_level", ['aal1', 'aal2', 'aal3'])
export const code_challenge_method = pgEnum("code_challenge_method", ['s256', 'plain'])
export const factor_status = pgEnum("factor_status", ['unverified', 'verified'])
export const factor_type = pgEnum("factor_type", ['totp', 'webauthn'])
export const one_time_token_type = pgEnum("one_time_token_type", ['confirmation_token', 'reauthentication_token', 'recovery_token', 'email_change_token_new', 'email_change_token_current', 'phone_change_token'])
export const key_status = pgEnum("key_status", ['default', 'valid', 'invalid', 'expired'])
export const key_type = pgEnum("key_type", ['aead-ietf', 'aead-det', 'hmacsha512', 'hmacsha256', 'auth', 'shorthash', 'generichash', 'kdf', 'secretbox', 'secretstream', 'stream_xchacha20'])
export const action = pgEnum("action", ['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'ERROR'])
export const equality_op = pgEnum("equality_op", ['eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'in'])


export const account = pgTable("account", {
	id: uuid("id").primaryKey().notNull(),
	name: text("name").notNull(),
	email: varchar("email", { length: 255 }).notNull(),
	password: text("password"),
	provider: varchar("provider", { length: 255 }),
	provider_account_id: varchar("provider_account_id", { length: 255 }),
	last_login: timestamp("last_login", { mode: 'string' }),
},
(table) => {
	return {
		users_email_key: uniqueIndex("users_email_key").using("btree", table.email),
	}
});

export const artifact_content = pgTable("artifact_content", {
	id: uuid("id").primaryKey().notNull(),
	account_id: uuid("account_id").notNull().references(() => account.id),
	artifact_id: uuid("artifact_id").notNull().references(() => artifact.id),
	type: text("type").notNull(),
	content: text("content").notNull(),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const artifact_tag = pgTable("artifact_tag", {
	account_id: uuid("account_id").notNull().references(() => account.id),
	artifact_id: uuid("artifact_id").notNull().references(() => artifact.id),
	tag_id: uuid("tag_id").notNull().references(() => tag.id),
},
(table) => {
	return {
		artifact_id_tag_id_key: uniqueIndex("artifact_tag_artifact_id_tag_id_key").using("btree", table.artifact_id, table.tag_id),
	}
});

export const artifact = pgTable("artifact", {
	id: uuid("id").primaryKey().notNull(),
	account_id: uuid("account_id").notNull().references(() => account.id),
	name: text("name").notNull(),
	description: text("description"),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const project_artifact_link = pgTable("project_artifact_link", {
	account_id: uuid("account_id").notNull().references(() => account.id),
	project_id: uuid("project_id").notNull().references(() => project.id),
	artifact_id: uuid("artifact_id").notNull().references(() => artifact.id),
	added_at: timestamp("added_at", { mode: 'string' }).defaultNow().notNull(),
});

export const project_tag = pgTable("project_tag", {
	account_id: uuid("account_id").notNull().references(() => account.id),
	project_id: uuid("project_id").notNull().references(() => project.id),
	tag_id: uuid("tag_id").notNull().references(() => tag.id),
},
(table) => {
	return {
		project_id_tag_id_key: uniqueIndex("project_tag_project_id_tag_id_key").using("btree", table.project_id, table.tag_id),
	}
});

export const project = pgTable("project", {
	id: uuid("id").primaryKey().notNull(),
	account_id: uuid("account_id").notNull().references(() => account.id),
	name: text("name").notNull(),
	description: text("description"),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	status: text("status").notNull(),
});

export const s3_usage = pgTable("s3_usage", {
	id: serial("id").primaryKey().notNull(),
	account_id: uuid("account_id").notNull().references(() => account.id),
	month: integer("month").notNull(),
	year: integer("year").notNull(),
	count: integer("count").default(0).notNull(),
},
(table) => {
	return {
		account_id_month_year_key: uniqueIndex("s3_usage_account_id_month_year_key").using("btree", table.account_id, table.month, table.year),
	}
});

export const tag = pgTable("tag", {
	id: uuid("id").primaryKey().notNull(),
	account_id: uuid("account_id").notNull().references(() => account.id),
	name: text("name").notNull(),
},
(table) => {
	return {
		account_id_name_key: uniqueIndex("tag_account_id_name_key").using("btree", table.account_id, table.name),
	}
});