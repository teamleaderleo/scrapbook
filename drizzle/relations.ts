import { relations } from "drizzle-orm/relations";
import { account, artifact_content, artifact, artifact_tag, tag, project_artifact_link, project, project_tag, s3_usage } from "./schema";

export const artifact_contentRelations = relations(artifact_content, ({one}) => ({
	account: one(account, {
		fields: [artifact_content.account_id],
		references: [account.id]
	}),
	artifact: one(artifact, {
		fields: [artifact_content.artifact_id],
		references: [artifact.id]
	}),
}));

export const accountRelations = relations(account, ({many}) => ({
	artifact_contents: many(artifact_content),
	artifact_tags: many(artifact_tag),
	artifacts: many(artifact),
	project_artifact_links: many(project_artifact_link),
	project_tags: many(project_tag),
	projects: many(project),
	s3_usages: many(s3_usage),
	tags: many(tag),
}));

export const artifactRelations = relations(artifact, ({one, many}) => ({
	artifact_contents: many(artifact_content),
	artifact_tags: many(artifact_tag),
	account: one(account, {
		fields: [artifact.account_id],
		references: [account.id]
	}),
	project_artifact_links: many(project_artifact_link),
}));

export const artifact_tagRelations = relations(artifact_tag, ({one}) => ({
	account: one(account, {
		fields: [artifact_tag.account_id],
		references: [account.id]
	}),
	artifact: one(artifact, {
		fields: [artifact_tag.artifact_id],
		references: [artifact.id]
	}),
	tag: one(tag, {
		fields: [artifact_tag.tag_id],
		references: [tag.id]
	}),
}));

export const tagRelations = relations(tag, ({one, many}) => ({
	artifact_tags: many(artifact_tag),
	project_tags: many(project_tag),
	account: one(account, {
		fields: [tag.account_id],
		references: [account.id]
	}),
}));

export const project_artifact_linkRelations = relations(project_artifact_link, ({one}) => ({
	account: one(account, {
		fields: [project_artifact_link.account_id],
		references: [account.id]
	}),
	artifact: one(artifact, {
		fields: [project_artifact_link.artifact_id],
		references: [artifact.id]
	}),
	project: one(project, {
		fields: [project_artifact_link.project_id],
		references: [project.id]
	}),
}));

export const projectRelations = relations(project, ({one, many}) => ({
	project_artifact_links: many(project_artifact_link),
	project_tags: many(project_tag),
	account: one(account, {
		fields: [project.account_id],
		references: [account.id]
	}),
}));

export const project_tagRelations = relations(project_tag, ({one}) => ({
	account: one(account, {
		fields: [project_tag.account_id],
		references: [account.id]
	}),
	project: one(project, {
		fields: [project_tag.project_id],
		references: [project.id]
	}),
	tag: one(tag, {
		fields: [project_tag.tag_id],
		references: [tag.id]
	}),
}));

export const s3_usageRelations = relations(s3_usage, ({one}) => ({
	account: one(account, {
		fields: [s3_usage.account_id],
		references: [account.id]
	}),
}));