import { sql } from '@vercel/postgres';
import {
  ArtifactField,
  ArtifactsTable,
  ProjectForm,
  ProjectsWithArtifacts,
  LatestProject,
  User,
} from './definitions';


export async function fetchLatestProjects() {
  try {
    const data = await sql<LatestProject>`
      SELECT 
        projects.id, 
        projects.name, 
        projects.description, 
        projects.date, 
        projects.user_id, 
        ARRAY_AGG(artifacts.name) AS artifact_names, 
        ARRAY_AGG(artifacts.image_url) AS artifact_image_urls
      FROM projects
      LEFT JOIN project_artifacts ON projects.id = project_artifacts.project_id
      LEFT JOIN artifacts ON project_artifacts.artifact_id = artifacts.id
      GROUP BY projects.id
      ORDER BY projects.date DESC
      LIMIT 5`;

    return data.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest projects.');
  }
}




export async function fetchCardData() {
  try {
    const projectCountPromise = sql`SELECT COUNT(*) FROM projects`;
    const artifactCountPromise = sql`SELECT COUNT(*) FROM artifacts`;
    const projectStatusPromise = sql`SELECT
         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS "completed",
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS "pending"
         FROM projects`;

    const data = await Promise.all([
      projectCountPromise,
      artifactCountPromise,
      projectStatusPromise,
    ]);

    const numberOfProjects = Number(data[0].rows[0].count ?? '0');
    const numberOfArtifacts = Number(data[1].rows[0].count ?? '0');
    const projectStatus = data[2].rows[0];

    return {
      numberOfArtifacts,
      numberOfProjects,
      numberOfPendingProjects: projectStatus.pending,
      numberOfCompletedProjects: projectStatus.completed,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}


const ITEMS_PER_PAGE = 6;

export async function fetchFilteredProjects(query: string, currentPage: number) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const projects = await sql<ProjectsWithArtifacts>`
      SELECT
        projects.id,
        projects.user_id,
        projects.name,
        projects.description,
        projects.date,
        projects.status,
        ARRAY_AGG(artifacts.name) AS artifact_names,
        ARRAY_AGG(artifacts.image_url) AS artifact_image_urls,
        ARRAY_AGG(artifacts.description) AS artifact_descriptions
      FROM projects
      LEFT JOIN project_artifacts ON projects.id = project_artifacts.project_id
      LEFT JOIN artifacts ON project_artifacts.artifact_id = artifacts.id
      WHERE
        projects.name ILIKE ${`%${query}%`} OR
        projects.description ILIKE ${`%${query}%`} OR
        projects.date::text ILIKE ${`%${query}%`} OR
        projects.status ILIKE ${`%${query}%`} OR
        artifacts.name ILIKE ${`%${query}%`} OR
        artifacts.description ILIKE ${`%${query}%`}
      GROUP BY projects.id
      ORDER BY projects.date DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;

    return projects.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch projects.');
  }
}




export async function fetchProjectsPages(query: string) {
  try {
    const count = await sql`
      SELECT COUNT(*)
      FROM projects
      LEFT JOIN project_artifacts ON projects.id = project_artifacts.project_id
      LEFT JOIN artifacts ON project_artifacts.artifact_id = artifacts.id
      WHERE
        projects.name ILIKE ${`%${query}%`} OR
        projects.description ILIKE ${`%${query}%`} OR
        projects.date::text ILIKE ${`%${query}%`} OR
        projects.status ILIKE ${`%${query}%`} OR
        artifacts.name ILIKE ${`%${query}%`} OR
        artifacts.description ILIKE ${`%${query}%`}
    `;

    const totalPages = Math.ceil(Number(count.rows[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of projects.');
  }
}


export async function fetchProject(id: string) {
  try {
    const data = await sql<ProjectForm>`
      SELECT
        projects.id,
        projects.name,
        projects.description,
        projects.date,
        projects.status,
        ARRAY_AGG(artifacts.id) AS artifact_ids
      FROM projects
      LEFT JOIN project_artifacts ON projects.id = project_artifacts.project_id
      LEFT JOIN artifacts ON project_artifacts.artifact_id = artifacts.id
      WHERE projects.id = ${id}
      GROUP BY projects.id;
    `;

    return data.rows[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch project.');
  }
}

export async function fetchArtifacts() {
  try {
    const data = await sql<ArtifactField>`
      SELECT
        id,
        name,
        description,
        image_url
      FROM artifacts
      ORDER BY name ASC
    `;

    return data.rows;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all artifacts.');
  }
}



// Handling No Projects: Using LEFT JOIN ensures that artifacts without projects are still returned.
// Distinct Aggregation: We use DISTINCT within COUNT and ARRAY_AGG to ensure unique counts and lists.
// Graceful Handling: Ensures artifacts returned even if not currently assigned to any projects.
export async function fetchFilteredArtifacts(query: string) {
  try {
    const data = await sql<ArtifactsTable>`
      SELECT
        artifacts.id,
        artifacts.user_id,
        artifacts.name,
        artifacts.description,
        artifacts.image_url,
        COUNT(DISTINCT projects.id) AS total_projects,
        SUM(CASE WHEN projects.status = 'pending' THEN 1 ELSE 0 END) AS total_pending,
        SUM(CASE WHEN projects.status = 'completed' THEN 1 ELSE 0 END) AS total_completed,
        ARRAY_AGG(DISTINCT projects.name) AS project_names
      FROM artifacts
      LEFT JOIN project_artifacts ON artifacts.id = project_artifacts.artifact_id
      LEFT JOIN projects ON project_artifacts.project_id = projects.id
      WHERE
        artifacts.name ILIKE ${`%${query}%`} OR
        artifacts.description ILIKE ${`%${query}%`}
      GROUP BY artifacts.id, artifacts.user_id, artifacts.name, artifacts.description, artifacts.image_url
      ORDER BY artifacts.name ASC
    `;

    return data.rows;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch artifact table.');
  }
}


export async function getUser(email: string) {
  try {
    const user = await sql`SELECT * FROM users WHERE email=${email}`;
    return user.rows[0] as User;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}
