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

export async function fetchProject(id: string) {
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
          'content', (SELECT content FROM artifact_contents WHERE artifact_id = a.id ORDER BY created_at DESC LIMIT 1)
        )) FILTER (WHERE a.id IS NOT NULL), '[]') AS artifacts
      FROM projects p
      LEFT JOIN tags t ON p.id = t.project_id
      LEFT JOIN project_artifact_links pal ON p.id = pal.project_id
      LEFT JOIN artifacts a ON pal.artifact_id = a.id
      WHERE p.id = ${id}
      GROUP BY p.id`;

    return data.rows[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch project.');
  }
}

const ITEMS_PER_PAGE = 6;
export async function fetchProjectsPages(query: string = '') {
  try {
    const count = await sql`
      SELECT COUNT(DISTINCT p.id)
      FROM projects p
      LEFT JOIN project_artifacts pa ON p.id = pa.project_id
      LEFT JOIN artifacts a ON pa.artifact_id = a.id
      WHERE
        p.name ILIKE ${`%${query}%`} OR
        p.description ILIKE ${`%${query}%`} OR
        a.name ILIKE ${`%${query}%`}`;

    const totalPages = Math.ceil(Number(count.rows[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of projects.');
  }
}

export async function fetchLatestProjects(limit: number = 5) {
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
          'content', (SELECT content FROM artifact_contents WHERE artifact_id = a.id ORDER BY created_at DESC LIMIT 1)
        )) FILTER (WHERE a.id IS NOT NULL), '[]') AS artifacts
      FROM projects p
      LEFT JOIN tags t ON p.id = t.project_id
      LEFT JOIN project_artifact_links pal ON p.id = pal.project_id
      LEFT JOIN artifacts a ON pal.artifact_id = a.id
      GROUP BY p.id
      ORDER BY p.updated_at DESC
      LIMIT ${limit}`;

    return data.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch latest projects.');
  }
}

export async function fetchProjects(query: string = '', currentPage: number = 1) {
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
          'content', (SELECT content FROM artifact_contents WHERE artifact_id = a.id ORDER BY created_at DESC LIMIT 1)
        )) FILTER (WHERE a.id IS NOT NULL), '[]') AS artifacts,
        COUNT(DISTINCT p.id) OVER() AS total_projects,
        SUM(CASE WHEN p.status = 'pending' THEN 1 ELSE 0 END) OVER() AS total_pending,
        SUM(CASE WHEN p.status = 'completed' THEN 1 ELSE 0 END) OVER() AS total_completed,
        COUNT(DISTINCT t.id) OVER() AS total_tags,
        COUNT(DISTINCT a.id) OVER() AS total_associated_artifacts
      FROM projects p
      LEFT JOIN tags t ON p.id = t.project_id
      LEFT JOIN project_artifact_links pal ON p.id = pal.project_id
      LEFT JOIN artifacts a ON pal.artifact_id = a.id
      WHERE
        p.name ILIKE ${`%${query}%`} OR
        p.description ILIKE ${`%${query}%`} OR
        t.name ILIKE ${`%${query}%`} OR
        a.name ILIKE ${`%${query}%`}
      GROUP BY p.id
      ORDER BY p.updated_at DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}`;

    return data.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch projects.');
  }
}

export async function fetchArtifact(id: string) {
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
      FROM artifacts a
      LEFT JOIN artifact_contents ac ON a.id = ac.artifact_id
      LEFT JOIN tags t ON a.id = t.artifact_id
      LEFT JOIN project_artifact_links pal ON a.id = pal.artifact_id
      LEFT JOIN projects p ON pal.project_id = p.id
      WHERE a.id = ${id}
      GROUP BY a.id`;

    return data.rows[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch artifact.');
  }
}

export async function fetchLatestArtifacts(limit: number = 5) {
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
      FROM artifacts a
      LEFT JOIN artifact_contents ac ON a.id = ac.artifact_id
      LEFT JOIN tags t ON a.id = t.artifact_id
      LEFT JOIN project_artifact_links pal ON a.id = pal.artifact_id
      LEFT JOIN projects p ON pal.project_id = p.id
      GROUP BY a.id
      ORDER BY a.updated_at DESC
      LIMIT ${limit}`;

    return data.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch latest artifacts.');
  }
}

// Handling No Projects: Using LEFT JOIN ensures that artifacts without projects are still returned.
// Distinct Aggregation: We use DISTINCT within COUNT and ARRAY_AGG to ensure unique counts and lists.
// Graceful Handling: Ensures artifacts returned even if not currently assigned to any projects.
export async function fetchArtifacts(query: string = '') {
  try {
    const data = await sql<ArtifactView>`
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
        COUNT(DISTINCT a.id) OVER() AS total_artifacts,
        COUNT(DISTINCT t.id) OVER() AS total_tags,
        COUNT(DISTINCT p.id) OVER() AS total_associated_projects
      FROM artifacts a
      LEFT JOIN artifact_contents ac ON a.id = ac.artifact_id
      LEFT JOIN tags t ON a.id = t.artifact_id
      LEFT JOIN project_artifact_links pal ON a.id = pal.artifact_id
      LEFT JOIN projects p ON pal.project_id = p.id
      WHERE
        a.name ILIKE ${`%${query}%`} OR
        a.description ILIKE ${`%${query}%`} OR
        ac.content ILIKE ${`%${query}%`} OR
        t.name ILIKE ${`%${query}%`}
      GROUP BY a.id
      ORDER BY a.updated_at DESC`;

    return data.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch artifacts.');
  }
}

export async function fetchCardData() {
  try {
    const data = await sql`
      SELECT
        (SELECT COUNT(*) FROM projects) AS total_projects,
        (SELECT COUNT(*) FROM artifacts) AS total_artifacts,
        (SELECT COUNT(*) FROM projects WHERE status = 'pending') AS pending_projects,
        (SELECT COUNT(*) FROM projects WHERE status = 'completed') AS completed_projects`;

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

export async function fetchDashboardData(account_id: string) {
  try {
    const data = await sql<DashboardView>`
      SELECT
        ${account_id} AS account_id,
        (SELECT COUNT(*) FROM Accounts) AS totalAccounts,
        (SELECT COUNT(*) FROM projects) AS total_projects,
        (SELECT COUNT(*) FROM artifacts) AS total_artifacts,
        (SELECT COUNT(*) FROM tags) AS total_tags,
        (SELECT COUNT(*) FROM projects WHERE status = 'completed') AS completed_projects,
        (SELECT COUNT(*) FROM projects WHERE status = 'pending') AS pending_projects
    `;

    return data.rows[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch dashboard data.');
  }
}
