import { eq, and, or, ilike, sql, SQL } from 'drizzle-orm';
import { db } from './db/db';
import { artifacts, artifactContents, artifactTags, tags, projectArtifactLinks, projects } from './db/schema';

export async function fetchArtifacts(
  accountId: string,
  query: string = '',
  currentPage: number = 1,
  options: {
    searchContent?: boolean,
    searchTags?: boolean,
    includeProjects?: boolean,
    fullCount?: boolean
  } = {}
) {
  const ITEMS_PER_PAGE = 6;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const accountCondition = eq(artifacts.accountId, accountId);
  let whereClause: SQL<unknown> | undefined = accountCondition;

  if (query) {
    const queryConditions: SQL<unknown>[] = [ilike(artifacts.name, `%${query}%`)];
    
    if (options.searchContent) {
      queryConditions.push(ilike(artifactContents.content, `%${query}%`));
    }
    
    if (options.searchTags) {
      queryConditions.push(ilike(tags.name, `%${query}%`));
    }
    
    const queryWhereClause = or(...queryConditions);
    
    // Combine conditions only if accountCondition is defined
    if (accountCondition) {
      whereClause = and(accountCondition, queryWhereClause);
    } else {
      whereClause = queryWhereClause;
    }
  }

  const selectObject: Record<string, any> = {
    id: artifacts.id,
    accountId: artifacts.accountId,
    name: artifacts.name,
    description: artifacts.description,
    createdAt: artifacts.createdAt,
    updatedAt: artifacts.updatedAt,
    contents: sql<string>`
      COALESCE(
        jsonb_agg(DISTINCT jsonb_build_object(
          'id', ${artifactContents.id},
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

  if (options.includeProjects) {
    selectObject.projects = sql<string>`
      COALESCE(
        jsonb_agg(DISTINCT jsonb_build_object(
          'id', ${projects.id},
          'name', ${projects.name},
          'status', ${projects.status}
        )) FILTER (WHERE ${projects.id} IS NOT NULL),
        '[]'
      )
    `.as('projects');
  }

  if (options.fullCount) {
    selectObject.totalArtifacts = sql<number>`COUNT(DISTINCT ${artifacts.id}) OVER()`.as('totalArtifacts');
    selectObject.totalTags = sql<number>`COUNT(DISTINCT ${tags.id}) OVER()`.as('totalTags');
    selectObject.totalAssociatedProjects = sql<number>`COUNT(DISTINCT ${projects.id}) OVER()`.as('totalAssociatedProjects');
  }

  const artifactsQuery = db
    .select(selectObject)
    .from(artifacts)
    .leftJoin(artifactContents, eq(artifacts.id, artifactContents.artifactId))
    .leftJoin(artifactTags, eq(artifacts.id, artifactTags.artifactId))
    .leftJoin(tags, eq(artifactTags.tagId, tags.id));

  if (options.includeProjects) {
    artifactsQuery.leftJoin(projectArtifactLinks, eq(artifacts.id, projectArtifactLinks.artifactId))
      .leftJoin(projects, eq(projectArtifactLinks.projectId, projects.id));
  }

  // Apply where clause only if it's defined
  const finalQuery = whereClause 
    ? artifactsQuery.where(whereClause)
    : artifactsQuery;

  const result = await finalQuery
    .groupBy(artifacts.id)
    .orderBy(artifacts.updatedAt)
    .limit(ITEMS_PER_PAGE)
    .offset(offset);

  return {
    artifacts: result,
    totalCount: result.length > 0 && options.fullCount ? Number(result[0].totalArtifacts) : undefined,
    totalTags: result.length > 0 && options.fullCount ? Number(result[0].totalTags) : undefined,
    totalAssociatedProjects: result.length > 0 && options.fullCount ? Number(result[0].totalAssociatedProjects) : undefined,
  };
}