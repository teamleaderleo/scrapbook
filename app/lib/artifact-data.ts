import { eq, and, or, ilike, sql, SQL, desc } from 'drizzle-orm';
import { db } from './db/db';
import { artifacts, artifactContents, artifactTags, tags, projectArtifactLinks, projects } from './db/schema';

export async function fetchAllArtifacts(
  accountId: string,
  currentPage: number = 1,
  includeProjects: boolean = false
) {
  const ITEMS_PER_PAGE = 6;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

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
    .orderBy(desc(artifacts.updatedAt))
    .limit(ITEMS_PER_PAGE)
    .offset(offset);

  const totalCount = await db
    .select({ count: sql`COUNT(*)` })
    .from(artifacts)
    .where(eq(artifacts.accountId, accountId));

  return {
    artifacts: result,
    totalCount: Number(totalCount[0].count),
  };
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
  const ITEMS_PER_PAGE = 6;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

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
    .limit(ITEMS_PER_PAGE)
    .offset(offset);

  const totalCount = await db
    .select({ count: sql`COUNT(DISTINCT ${artifacts.id})` })
    .from(artifacts)
    .leftJoin(artifactContents, eq(artifacts.id, artifactContents.artifactId))
    .leftJoin(artifactTags, eq(artifacts.id, artifactTags.artifactId))
    .leftJoin(tags, eq(artifactTags.tagId, tags.id))
    .where(and(eq(artifacts.accountId, accountId), searchCondition));

  return {
    artifacts: result,
    totalCount: Number(totalCount[0].count),
  };
}

function getSelectObject(includeProjects: boolean = false): Record<string, any> {
  const selectObject: Record<string, any> = {
    id: artifacts.id,
    accountId: artifacts.accountId,
    name: artifacts.name,
    description: artifacts.description,
    createdAt: sql`to_char(${artifacts.createdAt}, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`.as('createdAt'),
    updatedAt: sql`to_char(${artifacts.updatedAt}, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`.as('updatedAt'),
    contents: sql<string>`
      COALESCE(
        jsonb_agg(DISTINCT jsonb_build_object(
          'id', ${artifactContents.id},
          'type', ${artifactContents.type},
          'content', ${artifactContents.content},
          'created_at', to_json(${artifactContents.createdAt})
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
          'name', ${projects.name},
          'status', ${projects.status}
        )) FILTER (WHERE ${projects.id} IS NOT NULL),
        '[]'
      )
    `.as('projects');
  }

  return selectObject;
}