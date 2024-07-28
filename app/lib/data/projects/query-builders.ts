import { SQL, SQLWrapper, and, eq } from 'drizzle-orm';
import { projects, projectTags, tags, projectArtifactLinks, artifacts, artifactContents, artifactTags } from '../../db/schema';
import { baseProjectSelect, tagSelect, artifactSelect, artifactContentSelect, artifactTagSelect } from '../../definitions/select-objects';
import { ProjectFetchOptions } from '../../definitions/definitions';

export function createProjectQuery(db: any, conditions: SQLWrapper[] = [], options: ProjectFetchOptions = { includeTags: false, includeArtifacts: 'none' }) {
  let query = db
    .select({
      ...baseProjectSelect,
      ...(options.includeTags ? { 
        tags: db.jsonBuildObject({
          id: tags.id,
          name: tags.name,
          accountId: tags.accountId,
        }).as('tag')
      } : {}),
      ...(options.includeArtifacts !== 'none' ? { 
        artifacts: db.jsonBuildObject({
          ...artifactSelect,
          ...(options.includeArtifacts === 'withContents' || options.includeArtifacts === 'extended' ? {
            contents: db.jsonBuildObject(artifactContentSelect).as('content')
          } : {}),
          ...(options.includeArtifacts === 'extended' ? {
            tags: db.jsonBuildObject({
              id: tags.id,
              name: tags.name,
              accountId: tags.accountId,
            }).as('artifactTag')
          } : {})
        }).as('artifact')
      } : {})
    })
    .from(projects)
    .where(and(...conditions));

  if (options.includeTags) {
    query = query
      .leftJoin(projectTags, eq(projects.id, projectTags.projectId))
      .leftJoin(tags, eq(projectTags.tagId, tags.id));
  }

  if (options.includeArtifacts !== 'none') {
    query = query
      .leftJoin(projectArtifactLinks, eq(projects.id, projectArtifactLinks.projectId))
      .leftJoin(artifacts, eq(projectArtifactLinks.artifactId, artifacts.id));

    if (options.includeArtifacts === 'withContents' || options.includeArtifacts === 'extended') {
      query = query.leftJoin(artifactContents, eq(artifacts.id, artifactContents.artifactId));
    }

    if (options.includeArtifacts === 'extended') {
      query = query
        .leftJoin(artifactTags, eq(artifacts.id, artifactTags.artifactId))
        .leftJoin(tags, eq(artifactTags.tagId, tags.id));
    }
  }

  return query.groupBy(projects.id);
}

export function createProjectBasicsQuery(db: any, conditions: SQLWrapper[] = []) {
  return db
    .select({
      id: projects.id,
      name: projects.name,
      status: projects.status,
    })
    .from(projects)
    .where(and(...conditions));
}

export function createProjectPreviewQuery(db: any, conditions: SQLWrapper[] = []) {
  return db
    .select({
      ...baseProjectSelect,
      previewArtifact: {
        id: artifacts.id,
        name: artifacts.name,
        previewContent: artifactContents.content,
      },
    })
    .from(projects)
    .leftJoin(projectArtifactLinks, eq(projects.id, projectArtifactLinks.projectId))
    .leftJoin(artifacts, eq(projectArtifactLinks.artifactId, artifacts.id))
    .leftJoin(artifactContents, eq(artifacts.id, artifactContents.artifactId))
    .where(and(...conditions));
}