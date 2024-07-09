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
        COALESCE(json_agg(DISTINCT jsonb_build_object(
          'id', t.id,
          'name', t.name
        )) FILTER (WHERE t.id IS NOT NULL), '[]') AS tags,
        COALESCE(json_agg(DISTINCT jsonb_build_object(
          'id', a.id,
          'name', a.name,
          'type', a.type,
          'content', (SELECT content FROM artifact_content WHERE artifact_id = a.id AND account_id = ${accountId} ORDER BY created_at DESC LIMIT 1)
        )) FILTER (WHERE a.id IS NOT NULL), '[]') AS artifacts
      FROM project p
      LEFT JOIN tag t ON p.id = t.project_id
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
      LEFT JOIN project_artifact_link pal ON p.id = pal.project_id AND pal.account_id = ${accountId}
      LEFT JOIN artifact a ON pal.artifact_id = a.id
      WHERE
        p.account_id = ${accountId} AND
        (p.name ILIKE ${`%${query}%`} OR
        p.description ILIKE ${`%${query}%`} OR
        a.name ILIKE ${`%${query}%`})`;

    const totalPages = Math.ceil(Number(count.rows[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of projects.');
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
        COALESCE(json_agg(DISTINCT jsonb_build_object(
          'id', t.id,
          'name', t.name
        )) FILTER (WHERE t.id IS NOT NULL), '[]') AS tags,
        COALESCE(json_agg(DISTINCT jsonb_build_object(
          'id', a.id,
          'name', a.name,
          'type', a.type,
          'contents', (
            SELECT json_agg(jsonb_build_object(
              'id', ac.id,
              'type', ac.type,
              'content', ac.content,
              'created_at', ac.created_at
            ))
            FROM artifact_content ac
            WHERE ac.artifact_id = a.id AND ac.account_id = ${accountId}
          )
        )) FILTER (WHERE a.id IS NOT NULL), '[]') AS artifacts
      FROM project p
      LEFT JOIN tag t ON p.id = t.project_id
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
        COALESCE(json_agg(DISTINCT jsonb_build_object(
          'id', t.id,
          'name', t.name
        )) FILTER (WHERE t.id IS NOT NULL), '[]') AS tags,
        COALESCE(json_agg(DISTINCT jsonb_build_object(
          'id', a.id,
          'name', a.name,
          'type', a.type,
          'contents', (
            SELECT json_agg(jsonb_build_object(
              'id', ac.id,
              'type', ac.type,
              'content', ac.content,
              'created_at', ac.created_at
            ))
            FROM artifact_content ac
            WHERE ac.artifact_id = a.id AND ac.account_id = ${accountId}
          )
        )) FILTER (WHERE a.id IS NOT NULL), '[]') AS artifacts
      FROM project p
      LEFT JOIN tag t ON p.id = t.project_id
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

    console.log('Fetched projects:', JSON.stringify(data.rows, null, 2));
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
        a.type,
        a.description,
        a.created_at,
        a.updated_at,
        COALESCE(json_agg(DISTINCT jsonb_build_object(
          'id', ac.id,
          'type', ac.type,
          'content', ac.content,
          'created_at', ac.created_at
        )) FILTER (WHERE ac.id IS NOT NULL), '[]') AS contents,
        COALESCE(json_agg(DISTINCT jsonb_build_object(
          'id', t.id,
          'name', t.name
        )) FILTER (WHERE t.id IS NOT NULL), '[]') AS tags,
        COALESCE(json_agg(DISTINCT jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'status', p.status
        )) FILTER (WHERE p.id IS NOT NULL), '[]') AS projects
      FROM artifact a
      LEFT JOIN artifact_content ac ON a.id = ac.artifact_id AND ac.account_id = ${accountId}
      LEFT JOIN tag t ON a.id = t.artifact_id
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
        a.type,
        a.description,
        a.created_at,
        a.updated_at,
        COALESCE(json_agg(DISTINCT jsonb_build_object(
          'id', ac.id,
          'type', ac.type,
          'content', ac.content,
          'created_at', ac.created_at
        )) FILTER (WHERE ac.id IS NOT NULL), '[]') AS contents,
        COALESCE(json_agg(DISTINCT jsonb_build_object(
          'id', t.id,
          'name', t.name
        )) FILTER (WHERE t.id IS NOT NULL), '[]') AS tags,
        COALESCE(json_agg(DISTINCT jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'status', p.status
        )) FILTER (WHERE p.id IS NOT NULL), '[]') AS projects
      FROM artifact a
      LEFT JOIN artifact_content ac ON a.id = ac.artifact_id AND ac.account_id = ${accountId}
      LEFT JOIN tag t ON a.id = t.artifact_id
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

export async function fetchArtifacts(accountId: string, query: string = '', currentPage: number = 1) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  try {
    const data = await sql<ArtifactView>`
      WITH filtered_artifacts AS (
        SELECT a.id
        FROM artifact a
        LEFT JOIN artifact_content ac ON a.id = ac.artifact_id AND ac.account_id = ${accountId}
        LEFT JOIN tag t ON a.id = t.artifact_id
        WHERE
          a.account_id = ${accountId} AND
          (a.name ILIKE ${`%${query}%`} OR
          a.description ILIKE ${`%${query}%`} OR
          ac.content ILIKE ${`%${query}%`} OR
          t.name ILIKE ${`%${query}%`})
      )
      SELECT
        a.id,
        a.account_id,
        a.name,
        a.type,
        a.description,
        a.created_at,
        a.updated_at,
        COALESCE(json_agg(DISTINCT jsonb_build_object(
          'id', ac.id,
          'type', ac.type,
          'content', ac.content,
          'created_at', ac.created_at
        )) FILTER (WHERE ac.id IS NOT NULL), '[]') AS contents,
        COALESCE(json_agg(DISTINCT jsonb_build_object(
          'id', t.id,
          'name', t.name
        )) FILTER (WHERE t.id IS NOT NULL), '[]') AS tags,
        COALESCE(json_agg(DISTINCT jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'status', p.status
        )) FILTER (WHERE p.id IS NOT NULL), '[]') AS projects,
        (SELECT COUNT(*) FROM filtered_artifacts) AS total_artifacts,
        (SELECT COUNT(DISTINCT t.id) FROM filtered_artifacts fa JOIN tag t ON fa.id = t.artifact_id) AS total_tags,
        (SELECT COUNT(DISTINCT p.id) FROM filtered_artifacts fa JOIN project_artifact_link pal ON fa.id = pal.artifact_id JOIN project p ON pal.project_id = p.id) AS total_associated_projects
      FROM artifact a
      LEFT JOIN artifact_content ac ON a.id = ac.artifact_id AND ac.account_id = ${accountId}
      LEFT JOIN tag t ON a.id = t.artifact_id
      LEFT JOIN project_artifact_link pal ON a.id = pal.artifact_id AND pal.account_id = ${accountId}
      LEFT JOIN project p ON pal.project_id = p.id
      WHERE a.id IN (SELECT id FROM filtered_artifacts)
      GROUP BY a.id
      ORDER BY a.updated_at DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}`;

    return data.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch artifacts.');
  }
}

export async function fetchCardData(accountId: string) {
  try {
    const data = await sql`
      SELECT
        (SELECT COUNT(*) FROM project WHERE account_id = ${accountId}) AS total_projects,
        (SELECT COUNT(*) FROM artifact WHERE account_id = ${accountId}) AS total_artifacts,
        (SELECT COUNT(*) FROM project WHERE account_id = ${accountId} AND status = 'pending') AS pending_projects,
        (SELECT COUNT(*) FROM project WHERE account_id = ${accountId} AND status = 'completed') AS completed_projects`;

    const { total_projects, total_artifacts, pending_projects, completed_projects } = data.rows[0];

    return {
      numberOfProjects: Number(total_projects),
      numberOfArtifacts: Number(total_artifacts),
      numberOfPendingProjects: Number(pending_projects),
      numberOfCompletedProjects: Number(completed_projects),
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
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
        (SELECT COUNT(*) FROM tag WHERE account_id = ${accountId}) AS total_tags,
        (SELECT COUNT(*) FROM project WHERE account_id = ${accountId} AND status = 'completed') AS completed_projects,
        (SELECT COUNT(*) FROM project WHERE account_id = ${accountId} AND status = 'pending') AS pending_projects
    `;

    return data.rows[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch dashboard data.');
  }
}
