import { eq, and, or, ilike, sql, SQL, desc } from 'drizzle-orm';
import { db } from './db/db';
import { artifacts, artifactContents, artifactTags, tags, projectArtifactLinks, projects } from './db/schema';
import { ARTIFACT_ITEMS_PER_PAGE } from '@/components/ui/artifacts/table';
import { ArtifactWithRelations } from './definitions';

export async function fetchAllArtifacts(
  accountId: string,
  includeProjects: boolean = false
): Promise<ArtifactWithRelations[]> {
  const selectObject = getSelectObject(includeProjects);

  const query = db
    .select(selectObject)
    .from(artifacts)
    .leftJoin(artifactContents, eq(artifacts.id, artifactContents.artifactId))
    .leftJoin(artifactTags, eq(artifacts.id, artifactTags.artifactId))
    .leftJoin(tags, eq(artifactTags.tagId, tags.id))
    .where(eq(artifacts.accountId, accountId));

  if (includeProjects) {
    query.leftJoin(projectArtifactLinks, eq(artifacts.id, projectArtifactLinks.artifactId))
      .leftJoin(projects, eq(projectArtifactLinks.projectId, projects.id));
  }

  const result = await query
    .groupBy(artifacts.id)
    .orderBy(desc(artifacts.updatedAt));

  return result.map(artifact => ({
    id: artifact.id,
    accountId: artifact.accountId,
    name: artifact.name,
    description: artifact.description,
    createdAt: new Date(artifact.createdAt),
    updatedAt: new Date(artifact.updatedAt),
    contents: Array.isArray(artifact.contents) ? artifact.contents.map((content: any) => ({
      id: content.id,
      accountId: content.accountId,
      type: content.type,
      content: content.content,
      createdAt: new Date(content.createdAt),
    })) : [],
    tags: Array.isArray(artifact.tags) ? artifact.tags.map((tag: any) => ({
      id: tag.id,
      accountId: tag.accountId,
      name: tag.name,
    })) : [],
    projects: includeProjects && Array.isArray(artifact.projects) ? artifact.projects.map((project: any) => ({
      id: project.id,
      accountId: project.accountId,
      name: project.name,
      description: project.description,
      createdAt: new Date(project.createdAt),
      updatedAt: new Date(project.updatedAt),
      status: project.status,
    })) : [],
  }));
}

export async function searchArtifacts(
  accountId: string,
  query: string,
  currentPage: number = 1,
  options: {
    searchContent?: boolean,
    searchTags?: boolean,
    includeProjects?: boolean,
  } = {}
) {

  const offset = (currentPage - 1) * ARTIFACT_ITEMS_PER_PAGE;

  const selectObject = getSelectObject(options.includeProjects);

  const baseQuery = db
    .select(selectObject)
    .from(artifacts)
    .where(eq(artifacts.accountId, accountId)) as any;

  let searchCondition = or(
    ilike(artifacts.name, `%${query}%`),
    ilike(artifacts.description, `%${query}%`)
  );

  if (options.searchContent) {
    baseQuery.leftJoin(artifactContents, eq(artifacts.id, artifactContents.artifactId));
    searchCondition = or(searchCondition, ilike(artifactContents.content, `%${query}%`));
  }

  if (options.searchTags) {
    baseQuery.leftJoin(artifactTags, eq(artifacts.id, artifactTags.artifactId))
             .leftJoin(tags, eq(artifactTags.tagId, tags.id));
    searchCondition = or(searchCondition, ilike(tags.name, `%${query}%`));
  }

  if (options.includeProjects) {
    baseQuery.leftJoin(projectArtifactLinks, eq(artifacts.id, projectArtifactLinks.artifactId))
             .leftJoin(projects, eq(projectArtifactLinks.projectId, projects.id));
  }

  const finalQuery = baseQuery.where(searchCondition);

  const result = await finalQuery
    .groupBy(artifacts.id)
    .orderBy(desc(artifacts.updatedAt))
    .limit(ARTIFACT_ITEMS_PER_PAGE)
    .offset(offset);

  return {
    artifacts: result,
  };
}

function getSelectObject(includeProjects: boolean = false): Record<string, any> {
  const selectObject: Record<string, any> = {
    id: artifacts.id,
    account_id: artifacts.accountId,
    name: artifacts.name,
    description: artifacts.description,
    created_at: artifacts.createdAt,
    updated_at: artifacts.updatedAt,
    contents: sql<string>`
      COALESCE(
        jsonb_agg(DISTINCT jsonb_build_object(
          'id', ${artifactContents.id},
          'account_id', ${artifactContents.accountId},
          'type', ${artifactContents.type},
          'content', ${artifactContents.content},
          'created_at', ${artifactContents.createdAt}
        )) FILTER (WHERE ${artifactContents.id} IS NOT NULL),
        '[]'
      )
    `.as('contents'),
    tags: sql<string>`
      COALESCE(
        jsonb_agg(DISTINCT jsonb_build_object(
          'id', ${tags.id},
          'account_id', ${tags.accountId},
          'name', ${tags.name}
        )) FILTER (WHERE ${tags.id} IS NOT NULL),
        '[]'
      )
    `.as('tags'),
  };

  if (includeProjects) {
    selectObject.projects = sql<string>`
      COALESCE(
        jsonb_agg(DISTINCT jsonb_build_object(
          'id', ${projects.id},
          'account_id', ${projects.accountId},
          'name', ${projects.name},
          'status', ${projects.status},
          'created_at', ${projects.createdAt},
          'updated_at', ${projects.updatedAt}
        )) FILTER (WHERE ${projects.id} IS NOT NULL),
        '[]'
      )
    `.as('projects');
  }

  return selectObject;
}