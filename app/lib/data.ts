import { sql } from '@vercel/postgres';
import {
  Account,
  Artifact,
  ArtifactView,
  ArtifactDetail,
  Project,
  ProjectView,
  ProjectDetail,
  DashboardView,
  Tag
} from './definitions';

export async function getAccount(email: string) {
  try {
    const account = await sql`SELECT * FROM account WHERE email=${email}`;
    return account.rows[0] as Account;
  } catch (error) {
    console.error('Failed to fetch account:', error);
    throw new Error('Failed to fetch account.');
  }
}

export async function fetchProject(accountId: string, id: string) {
  try {
    const data = await sql<ProjectDetail>`
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

const ITEMS_PER_PAGE = 6;
export async function fetchProjectsPages(accountId: string, query: string = '') {
  try {
    const count = await sql`
      SELECT COUNT(DISTINCT p.id)
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
        a.name ILIKE ${`%${query}%`})`;

    const totalPages = Math.ceil(Number(count.rows[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of projects.');
  }
}

export async function fetchArtifactsPages(accountId: string, query: string = '') {
  try {
    const count = await sql`
      SELECT COUNT(DISTINCT a.id)
      FROM artifact a
      LEFT JOIN artifact_content ac ON a.id = ac.artifact_id AND ac.account_id = ${accountId}
      LEFT JOIN artifact_tag at ON a.id = at.artifact_id AND at.account_id = ${accountId}
      LEFT JOIN tag t ON at.tag_id = t.id AND t.account_id = ${accountId}
      WHERE
        a.account_id = ${accountId} AND
        (a.name ILIKE ${`%${query}%`} OR
        a.description ILIKE ${`%${query}%`} OR
        ac.content ILIKE ${`%${query}%`} OR
        t.name ILIKE ${`%${query}%`})`;

    const totalPages = Math.ceil(Number(count.rows[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of artifacts.');
  }
}

export async function fetchLatestProjects(accountId: string, limit: number = 5) {
  try {
    const data = await sql<ProjectDetail>`
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

export async function fetchProjects(accountId: string, query: string = '', currentPage: number = 1) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  try {
    const data = await sql<ProjectView>`
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
      ORDER BY p.updated_at DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}`;

    return data.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch projects.');
  }
}

export async function fetchArtifact(accountId: string, id: string) {
  try {
    const data = await sql<ArtifactDetail>`
      SELECT
        a.id,
        a.account_id,
        a.name,
        a.description,
        a.created_at,
        a.updated_at,
        COALESCE(
          jsonb_agg(DISTINCT jsonb_build_object(
            'id', ac.id,
            'type', ac.type,
            'content', ac.content,
            'created_at', ac.created_at
          )) FILTER (WHERE ac.id IS NOT NULL),
          '[]'
        ) AS contents,
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
            'id', p.id,
            'name', p.name,
            'status', p.status
          )) FILTER (WHERE p.id IS NOT NULL),
          '[]'
        ) AS projects
      FROM artifact a
      LEFT JOIN artifact_content ac ON a.id = ac.artifact_id AND ac.account_id = ${accountId}
      LEFT JOIN artifact_tag at ON a.id = at.artifact_id AND at.account_id = ${accountId}
      LEFT JOIN tag t ON at.tag_id = t.id AND t.account_id = ${accountId}
      LEFT JOIN project_artifact_link pal ON a.id = pal.artifact_id AND pal.account_id = ${accountId}
      LEFT JOIN project p ON pal.project_id = p.id
      WHERE a.id = ${id} AND a.account_id = ${accountId}
      GROUP BY a.id`;

    return data.rows[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch artifact.');
  }
}

export async function fetchLatestArtifacts(accountId: string, limit: number = 5) {
  try {
    const data = await sql<ArtifactDetail>`
      SELECT
        a.id,
        a.account_id,
        a.name,
        a.description,
        a.created_at,
        a.updated_at,
        COALESCE(
          jsonb_agg(DISTINCT jsonb_build_object(
            'id', ac.id,
            'type', ac.type,
            'content', ac.content,
            'created_at', ac.created_at
          )) FILTER (WHERE ac.id IS NOT NULL),
          '[]'
        ) AS contents,
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
            'id', p.id,
            'name', p.name,
            'status', p.status
          )) FILTER (WHERE p.id IS NOT NULL),
          '[]'
        ) AS projects
      FROM artifact a
      LEFT JOIN artifact_content ac ON a.id = ac.artifact_id AND ac.account_id = ${accountId}
      LEFT JOIN artifact_tag at ON a.id = at.artifact_id AND at.account_id = ${accountId}
      LEFT JOIN tag t ON at.tag_id = t.id AND t.account_id = ${accountId}
      LEFT JOIN project_artifact_link pal ON a.id = pal.artifact_id AND pal.account_id = ${accountId}
      LEFT JOIN project p ON pal.project_id = p.id
      WHERE a.account_id = ${accountId}
      GROUP BY a.id
      ORDER BY a.updated_at DESC
      LIMIT ${limit}`;

    return data.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch latest artifacts.');
  }
}



export async function fetchCardData(accountId: string) {
  try {
    const data = await sql`
      SELECT
        (SELECT COUNT(*) FROM project WHERE account_id = ${accountId}) AS total_projects,
        (SELECT COUNT(*) FROM artifact WHERE account_id = ${accountId}) AS total_artifacts,
        (SELECT COUNT(*) FROM project WHERE account_id = ${accountId} AND status = 'pending') AS pending_projects,
        (SELECT COUNT(*) FROM project WHERE account_id = ${accountId} AND status = 'completed') AS completed_projects,
        (SELECT COUNT(DISTINCT pt.tag_id) FROM project_tag pt
         JOIN project p ON pt.project_id = p.id
         WHERE p.account_id = ${accountId}) AS total_project_tags,
        (SELECT COUNT(DISTINCT at.tag_id) FROM artifact_tag at
         JOIN artifact a ON at.artifact_id = a.id
         WHERE a.account_id = ${accountId}) AS total_artifact_tags`;

    const { total_projects, total_artifacts, pending_projects, completed_projects, total_project_tags, total_artifact_tags } = data.rows[0];

    return {
      numberOfProjects: Number(total_projects),
      numberOfArtifacts: Number(total_artifacts),
      numberOfPendingProjects: Number(pending_projects),
      numberOfCompletedProjects: Number(completed_projects),
      numberOfProjectTags: Number(total_project_tags),
      numberOfArtifactTags: Number(total_artifact_tags),
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

export async function fetchTagsPages(accountId: string, query: string = '') {
  try {
    const count = await sql`
      SELECT COUNT(*)
      FROM tag
      WHERE account_id = ${accountId} AND name ILIKE ${`%${query}%`}
    `;

    const totalPages = Math.ceil(Number(count.rows[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of tags.');
  }
}

export async function fetchTags(accountId: string, query: string = '', currentPage: number = 1) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const tags = await sql<Tag>`
      SELECT t.id, t.account_id, t.name,
        (SELECT COUNT(*) FROM project_tag pt WHERE pt.tag_id = t.id) as project_count,
        (SELECT COUNT(*) FROM artifact_tag at WHERE at.tag_id = t.id) as artifact_count
      FROM tag t
      WHERE t.account_id = ${accountId} AND t.name ILIKE ${`%${query}%`}
      ORDER BY t.name
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;

    return tags.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch tags.');
  }
}

export async function fetchDashboardData(accountId: string) {
  try {
    const data = await sql<DashboardView>`
      SELECT
        ${accountId} AS account_id,
        (SELECT COUNT(*) FROM account) AS total_accounts,
        (SELECT COUNT(*) FROM project WHERE account_id = ${accountId}) AS total_projects,
        (SELECT COUNT(*) FROM artifact WHERE account_id = ${accountId}) AS total_artifacts,
        (SELECT COUNT(DISTINCT t.id) FROM tag t
         WHERE t.account_id = ${accountId}) AS total_tags,
        (SELECT COUNT(*) FROM project WHERE account_id = ${accountId} AND status = 'completed') AS completed_projects,
        (SELECT COUNT(*) FROM project WHERE account_id = ${accountId} AND status = 'pending') AS pending_projects
    `;

    return data.rows[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch dashboard data.');
  }
}
