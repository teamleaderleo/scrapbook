// import { db } from "../db/db.server";
// import { and, eq, or, ilike, desc, sql } from "drizzle-orm";
// import { projects, projectTags, tags, projectArtifactLinks, artifacts, artifactContents } from "../db/schema";
// import { FetchOptions, ProjectWithTags, ProjectWithArtifacts, ProjectWithExtendedArtifacts } from "../definitions";

// export async function searchProjects(
//   accountId: string,
//   query: string,
//   options: FetchOptions = {}
// ): Promise<(ProjectWithTags | ProjectWithArtifacts | ProjectWithExtendedArtifacts)[]> {
//   const selectObject = buildProjectSelectObject(options);

//   const baseQuery = db
//     .select(selectObject)
//     .from(projects)
//     .where(and(
//       eq(projects.accountId, accountId),
//       or(
//         ilike(projects.name, `%${query}%`),
//         ilike(projects.description, `%${query}%`)
//       )
//     ));

//   if (options.includeTags) {
//     baseQuery.leftJoin(projectTags, eq(projects.id, projectTags.projectId))
//              .leftJoin(tags, eq(projectTags.tagId, tags.id));
//   }
//   if (options.includeArtifacts !== 'none') {
//     baseQuery.leftJoin(projectArtifactLinks, eq(projects.id, projectArtifactLinks.projectId))
//              .leftJoin(artifacts, eq(projectArtifactLinks.artifactId, artifacts.id));
//   }

//   const result = await baseQuery
//     .groupBy(projects.id)
//     .orderBy(desc(projects.updatedAt));

//   return result.map(project => parseProjectResult(project, options));
// }

// export async function fetchLatestProjects(
//   accountId: string,
//   limit: number = 5,
//   options: FetchOptions = {}
// ): Promise<(ProjectWithTags | ProjectWithArtifacts | ProjectWithExtendedArtifacts)[]> {
//   const selectObject = buildProjectSelectObject(options);

//   const query = db
//     .select(selectObject)
//     .from(projects)
//     .where(eq(projects.accountId, accountId));

//   if (options.includeTags) {
//     query.leftJoin(projectTags, eq(projects.id, projectTags.projectId))
//          .leftJoin(tags, eq(projectTags.tagId, tags.id));
//   }
//   if (options.includeArtifacts !== 'none') {
//     query.leftJoin(projectArtifactLinks, eq(projects.id, projectArtifactLinks.projectId))
//          .leftJoin(artifacts, eq(projectArtifactLinks.artifactId, artifacts.id));
//   }

//   const result = await query
//     .groupBy(projects.id)
//     .orderBy(desc(projects.updatedAt))
//     .limit(limit);

//   return result.map(project => parseProjectResult(project, options));
// }

// function buildProjectSelectObject(options: FetchOptions = {}) {
//   const selectObject = {
//     id: projects.id,
//     accountId: projects.accountId,
//     name: projects.name,
//     description: projects.description,
//     createdAt: projects.createdAt,
//     updatedAt: projects.updatedAt,
//     status: projects.status,
//   };

//   if (options.includeTags) {
//     selectObject.tags = sql`
//       COALESCE(
//         jsonb_agg(DISTINCT jsonb_build_object(
//           'id', ${tags.id},
//           'accountId', ${tags.accountId},
//           'name', ${tags.name}
//         )) FILTER (WHERE ${tags.id} IS NOT NULL),
//         '[]'::jsonb
//       )
//     `.as('tags');
//   }

//   if (options.includeArtifacts !== 'none') {
//     const artifactContent = sql`
//       (
//         SELECT jsonb_agg(jsonb_build_object(
//           'id', ${artifactContents.id},
//           'type', ${artifactContents.type},
//           'content', ${artifactContents.content},
//           'variants', COALESCE(${artifactContents.variants}, '[]'::jsonb),
//           'metadata', COALESCE(${artifactContents.metadata}, '{}'::jsonb),
//           'createdAt', ${artifactContents.createdAt},
//           'createdBy', ${artifactContents.createdBy},
//           'lastModifiedBy', ${artifactContents.lastModifiedBy}
//         ))
//         FROM ${artifactContents}
//         WHERE ${artifactContents.artifactId} = ${artifacts.id} 
//           AND ${artifactContents.accountId} = ${projects.accountId}
//       )
//     `;

//     let artifactObject = sql`
//       jsonb_build_object(
//         'id', ${artifacts.id},
//         'accountId', ${artifacts.accountId},
//         'name', ${artifacts.name},
//         'description', ${artifacts.description},
//         'createdAt', ${artifacts.createdAt},
//         'updatedAt', ${artifacts.updatedAt},
//         'contents', ${artifactContent}
//       )
//     `;

//     if (options.includeArtifacts === 'extended') {
//       const artifactTags = sql`
//         (
//           SELECT jsonb_agg(DISTINCT jsonb_build_object(
//             'id', ${tags.id},
//             'accountId', ${tags.accountId},
//             'name', ${tags.name}
//           ))
//           FROM ${artifactTags}
//           JOIN ${tags} ON ${artifactTags.tagId} = ${tags.id}
//           WHERE ${artifactTags.artifactId} = ${artifacts.id}
//             AND ${artifactTags.accountId} = ${projects.accountId}
//         )
//       `;

//       const artifactProjects = sql`
//         (
//           SELECT jsonb_agg(DISTINCT jsonb_build_object(
//             'id', ${projects.id},
//             'accountId', ${projects.accountId},
//             'name', ${projects.name},
//             'description', ${projects.description},
//             'createdAt', ${projects.createdAt},
//             'updatedAt', ${projects.updatedAt},
//             'status', ${projects.status}
//           ))
//           FROM ${projectArtifactLinks}
//           JOIN ${projects} AS p2 ON ${projectArtifactLinks.projectId} = p2.id
//           WHERE ${projectArtifactLinks.artifactId} = ${artifacts.id}
//             AND ${projectArtifactLinks.accountId} = ${projects.accountId}
//             AND p2.id != ${projects.id}
//         )
//       `;

//       artifactObject = sql`
//         jsonb_build_object(
//           'id', ${artifacts.id},
//           'accountId', ${artifacts.accountId},
//           'name', ${artifacts.name},
//           'description', ${artifacts.description},
//           'createdAt', ${artifacts.createdAt},
//           'updatedAt', ${artifacts.updatedAt},
//           'contents', ${artifactContent},
//           'tags', ${artifactTags},
//           'projects', ${artifactProjects}
//         )
//       `;
//     }

//     selectObject.artifacts = sql`
//       COALESCE(
//         jsonb_agg(DISTINCT ${artifactObject}) FILTER (WHERE ${artifacts.id} IS NOT NULL),
//         '[]'::jsonb
//       )
//     `.as('artifacts');
//   }

//   return selectObject;
// }

// export async function fetchSingleProject(
//   accountId: string,
//   projectId: string,
//   options: FetchOptions = {}
// ): Promise<ProjectWithTags | ProjectWithArtifacts | ProjectWithExtendedArtifacts | null> {
//   const selectObject = buildProjectSelectObject(options);

//   const query = db
//     .select(selectObject)
//     .from(projects)
//     .where(and(eq(projects.accountId, accountId), eq(projects.id, projectId)));

//   if (options.includeTags) {
//     query.leftJoin(projectTags, eq(projects.id, projectTags.projectId))
//          .leftJoin(tags, eq(projectTags.tagId, tags.id));
//   }
//   if (options.includeArtifacts !== 'none') {
//     query.leftJoin(projectArtifactLinks, eq(projects.id, projectArtifactLinks.projectId))
//          .leftJoin(artifacts, eq(projectArtifactLinks.artifactId, artifacts.id));
//   }

//   const result = await query.groupBy(projects.id);

//   if (result.length === 0) {
//     return null;
//   }

//   return parseProjectResult(result[0], options);
// }

// function parseProjectResult(project: { id: string; accountId: string; name: string; description: string | null; createdAt: Date; updatedAt: Date; status: string; }, options: FetchOptions): any {
//     throw new Error("Function not implemented.");
// }
