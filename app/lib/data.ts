import { sql } from '@vercel/postgres';
import {
  Artifact,
  ArtifactsTable,
  Project,
  ProjectsWithArtifacts,
  LatestProject,
  LatestArtifact,
  User,
} from './definitions';

export async function getUser(email: string) {
  try {
    const user = await sql`SELECT * FROM users WHERE email=${email}`;
    return user.rows[0] as User;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}

export async function fetchProject(id: string) {
  try {
    const data = await sql<Project>`
      SELECT
        p.id,
        p.user_id,
        p.name,
        p.description,
        p.date,
        p.status,
        ARRAY_AGG(pa.artifact_id) AS artifact_ids
      FROM projects p
      LEFT JOIN project_artifacts pa ON p.id = pa.project_id
      WHERE p.id = ${id}
      GROUP BY p.id`;

    return data.rows[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch project.');
  }
}

const ITEMS_PER_PAGE = 6;

export async function fetchProjects(query: string, currentPage: number) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  try {
    const data = await sql<ProjectsWithArtifacts>`
      SELECT
        p.id,
        p.user_id,
        p.name,
        p.description,
        p.date,
        p.status,
        COALESCE(
          json_agg(
            json_build_object(
              'id', a.id,
              'name', a.name,
              'type', a.type,
              'content', a.content
            )
          ) FILTER (WHERE a.id IS NOT NULL),
          '[]'
        ) AS artifacts
      FROM projects p
      LEFT JOIN project_artifacts pa ON p.id = pa.project_id
      LEFT JOIN artifacts a ON pa.artifact_id = a.id
      WHERE
        p.name ILIKE ${`%${query}%`} OR
        p.description ILIKE ${`%${query}%`} OR
        a.name ILIKE ${`%${query}%`}
      GROUP BY p.id
      ORDER BY p.date DESC
      LIMITT.rowsFFSET ${offset}`;

    return data.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch filtered projects.');
  }
}

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
    const data = await sql<LatestProject>`
      SELECT 
        p.id, 
        p.name, 
        p.description, 
        p.date, 
        p.user_id,
        p.status,
        COALESCE(
          json_agg(
            json_build_object(
              'id', a.id,
              'name', a.name,
              'type', a.type,
              'content', a.content
            )
          ) FILTER (WHERE a.id IS NOT NULL),
          '[]'
        ) AS artifacts
      FROM projects p
      LEFT JOIN project_artifacts pa ON p.id = pa.project_id
      LEFT JOIN artifacts a ON pa.artifact_id = a.id
      GROUP BY p.id
      ORDER BY p.date DESC
      LIMIT ${limit}`;

    return data.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest projects.');
  }
}

export async function fetchArtifact(id: string) {
  try {
    const data = await sql<Artifact>`
      SELECT
        a.id,
        a.user_id,
        a.name,
        a.type,
        a.content,
        a.description,
        ARRAY_AGG(t.name) AS tags,
        a.created_at,
        a.updated_at
      FROM artifacts a
      LEFT JOIN artifact_tags at ON a.id = at.artifact_id
      LEFT JOIN tags t ON at.tag_id = t.id
      WHERE a.id = ${id}
      GROUP BY a.id`;

    return data.rows[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch artifact.');
  }
}

// Handling No Projects: Using LEFT JOIN ensures that artifacts without projects are still returned.
// Distinct Aggregation: We use DISTINCT within COUNT and ARRAY_AGG to ensure unique counts and lists.
// Graceful Handling: Ensures artifacts returned even if not currently assigned to any projects.
export async function fetchArtifacts(query: string = '') {
  try {
    const data = await sql<ArtifactsTable>`
      SELECT
        a.id,
        a.user_id,
        a.name,
        a.type,
        a.description,
        a.content,
        COUNT(DISTINCT pa.project_id) AS total_projects,
        SUM(CASE WHEN p.status = 'pending' THEN 1 ELSE 0 END) AS total_pending,
        SUM(CASE WHEN p.status = 'completed' THEN 1 ELSE 0 END) AS total_completed,
        ARRAY_AGG(DISTINCT t.name) AS tags,
        a.created_at,
        a.updated_at
      FROM artifacts a
      LEFT JOIN project_artifacts pa ON a.id = pa.artifact_id
      LEFT JOIN projects p ON pa.project_id = p.id
      LEFT JOIN artifact_tags at ON a.id = at.artifact_id
      LEFT JOIN tags t ON at.tag_id = t.id
      WHERE
        a.name ILIKE ${`%${query}%`} OR
        a.description ILIKE ${`%${query}%`} OR
        a.content ILIKE ${`%${query}%`} OR
        t.name ILIKE ${`%${query}%`}
      GROUP BY a.id
      ORDER BY a.updated_at DESC`;

    return data.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch filtered artifacts.');
  }
}

export async function fetchLatestArtifacts(limit: number = 5) {
  try {
    const data = await sql<LatestArtifact>`
      SELECT id, name, type, content, created_at
      FROM artifacts
      ORDER BY created_at DESC
      LIMIT ${limit}`;

    return data.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch latest artifacts.');
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
