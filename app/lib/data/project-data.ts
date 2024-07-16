import { ProjectWithRelations, FetchOptions } from '../definitions';

export async function fetchSingleProject(accountId: string, id: string) {
  try {
    const data = await sql<ProjectWithRelations>`
      SELECT
        p.id,
        p.account_id,
        p.name,
        p.description,
        p.created_at,
        p.updated_at,
        p.status,
        COALESCE(
          jsonb_agg(DISTINCT jsonb_build_object(
            'id', t.id,
            'account_id', t.account_id,
            'name', t.name
          )) FILTER (WHERE t.id IS NOT NULL),
          '[]'
        ) AS tags,
        COALESCE(
          jsonb_agg(DISTINCT jsonb_build_object(
            'id', a.id,
            'name', a.name,
            'contents', (
              SELECT jsonb_agg(jsonb_build_object(
                'id', ac.id,
                'type', ac.type,
                'content', ac.content,
                'created_at', ac.created_at
              ))
              FROM artifact_content ac
              WHERE ac.artifact_id = a.id AND ac.account_id = ${accountId}
            )
          )) FILTER (WHERE a.id IS NOT NULL),
          '[]'
        ) AS artifacts
      FROM project p
      LEFT JOIN project_tag pt ON p.id = pt.project_id AND pt.account_id = ${accountId}
      LEFT JOIN tag t ON pt.tag_id = t.id AND t.account_id = ${accountId}
      LEFT JOIN project_artifact_link pal ON p.id = pal.project_id AND pal.account_id = ${accountId}
      LEFT JOIN artifact a ON pal.artifact_id = a.id
      WHERE p.id = ${id} AND p.account_id = ${accountId}
      GROUP BY p.id`;

    return data.rows[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch project.');
  }
}


export async function fetchLatestProjects(accountId: string, limit: number = 5) {
  try {
    const data = await sql<ProjectWithRelations>`
      SELECT
        p.id,
        p.account_id,
        p.name,
        p.description,
        p.created_at,
        p.updated_at,
        p.status,
        COALESCE(
          jsonb_agg(DISTINCT jsonb_build_object(
            'id', t.id,
            'account_id', t.account_id,
            'name', t.name
          )) FILTER (WHERE t.id IS NOT NULL),
          '[]'
        ) AS tags,
        COALESCE(
          jsonb_agg(DISTINCT jsonb_build_object(
            'id', a.id,
            'name', a.name,
            'contents', (
              SELECT jsonb_agg(jsonb_build_object(
                'id', ac.id,
                'type', ac.type,
                'content', ac.content,
                'created_at', ac.created_at
              ))
              FROM artifact_content ac
              WHERE ac.artifact_id = a.id AND ac.account_id = ${accountId}
            )
          )) FILTER (WHERE a.id IS NOT NULL),
          '[]'
        ) AS artifacts
      FROM project p
      LEFT JOIN project_tag pt ON p.id = pt.project_id AND pt.account_id = ${accountId}
      LEFT JOIN tag t ON pt.tag_id = t.id AND t.account_id = ${accountId}
      LEFT JOIN project_artifact_link pal ON p.id = pal.project_id AND pal.account_id = ${accountId}
      LEFT JOIN artifact a ON pal.artifact_id = a.id
      WHERE p.account_id = ${accountId}
      GROUP BY p.id
      ORDER BY p.updated_at DESC
      LIMIT ${limit}`;

    return data.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch latest projects.');
  }
}

export async function fetchAllProjects(accountId: string, query: string = '') {
  try {
    const data = await sql<ProjectWithRelations>`
      SELECT
        p.id,
        p.account_id,
        p.name,
        p.description,
        p.created_at,
        p.updated_at,
        p.status,
        COALESCE(
          jsonb_agg(DISTINCT jsonb_build_object(
            'id', t.id,
            'account_id', t.account_id,
            'name', t.name
          )) FILTER (WHERE t.id IS NOT NULL),
          '[]'
        ) AS tags,
        COALESCE(
          jsonb_agg(DISTINCT jsonb_build_object(
            'id', a.id,
            'name', a.name,
            'contents', (
              SELECT jsonb_agg(jsonb_build_object(
                'id', ac.id,
                'type', ac.type,
                'content', ac.content,
                'created_at', ac.created_at
              ))
              FROM artifact_content ac
              WHERE ac.artifact_id = a.id AND ac.account_id = ${accountId}
            )
          )) FILTER (WHERE a.id IS NOT NULL),
          '[]'
        ) AS artifacts
      FROM project p
      LEFT JOIN project_tag pt ON p.id = pt.project_id AND pt.account_id = ${accountId}
      LEFT JOIN tag t ON pt.tag_id = t.id AND t.account_id = ${accountId}
      LEFT JOIN project_artifact_link pal ON p.id = pal.project_id AND pal.account_id = ${accountId}
      LEFT JOIN artifact a ON pal.artifact_id = a.id
      WHERE
        p.account_id = ${accountId} AND
        (p.name ILIKE ${`%${query}%`} OR
        p.description ILIKE ${`%${query}%`} OR
        t.name ILIKE ${`%${query}%`} OR
        a.name ILIKE ${`%${query}%`})
      GROUP BY p.id
      ORDER BY p.updated_at DESC`;

    return data.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch projects.');
  }
}