import { sql } from '@vercel/postgres';
import {
  ArtifactField,
  ArtifactsTableType,
  ProjectForm,
  ProjectsTable,
  LatestProjectRaw,
  User,
} from './definitions';


export async function fetchLatestProjects() {
  try {
    const data = await sql<LatestProjectRaw>`
      SELECT projects.amount, artifacts.name, artifacts.image_url, artifacts.email, projects.id
      FROM projects
      JOIN artifacts ON projects.artifact_id = artifacts.id
      ORDER BY projects.date DESC
      LIMIT 5`;

    const latestProjects = data.rows.map((project) => ({
      ...project,
      amount: formatCurrency(project.amount),
    }));
    return latestProjects;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest projects.');
  }
}

export async function fetchCardData() {
  try {
    // You can probably combine these into a single SQL query
    // However, we are intentionally splitting them to demonstrate
    // how to initialize multiple queries in parallel with JS.
    const projectCountPromise = sql`SELECT COUNT(*) FROM projects`;
    const artifactCountPromise = sql`SELECT COUNT(*) FROM artifacts`;
    const projectStatusPromise = sql`SELECT
         SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS "paid",
         SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
         FROM projects`;

    const data = await Promise.all([
      projectCountPromise,
      artifactCountPromise,
      projectStatusPromise,
    ]);

    const numberOfProjects = Number(data[0].rows[0].count ?? '0');
    const numberOfArtifacts = Number(data[1].rows[0].count ?? '0');

    return {
      numberOfArtifacts,
      numberOfProjects,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

const ITEMS_PER_PAGE = 6;
export async function fetchFilteredProjects(
  query: string,
  currentPage: number,
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const projects = await sql<ProjectsTable>`
      SELECT
        projects.id,
        projects.amount,
        projects.date,
        projects.status,
        artifacts.name,
        artifacts.email,
        artifacts.image_url
      FROM projects
      JOIN artifacts ON projects.artifact_id = artifacts.id
      WHERE
        artifacts.name ILIKE ${`%${query}%`} OR
        artifacts.email ILIKE ${`%${query}%`} OR
        projects.amount::text ILIKE ${`%${query}%`} OR
        projects.date::text ILIKE ${`%${query}%`} OR
        projects.status ILIKE ${`%${query}%`}
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
    const count = await sql`SELECT COUNT(*)
    FROM projects
    JOIN artifacts ON projects.artifact_id = artifacts.id
    WHERE
      artifacts.name ILIKE ${`%${query}%`} OR
      artifacts.email ILIKE ${`%${query}%`} OR
      projects.amount::text ILIKE ${`%${query}%`} OR
      projects.date::text ILIKE ${`%${query}%`} OR
      projects.status ILIKE ${`%${query}%`}
  `;

    const totalPages = Math.ceil(Number(count.rows[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of projects.');
  }
}

export async function fetchProjectById(id: string) {
  try {
    const data = await sql<ProjectForm>`
      SELECT
        projects.id,
        projects.artifact_id,
        projects.amount,
        projects.status
      FROM projects
      WHERE projects.id = ${id};
    `;

    const project = data.rows.map((project) => ({
      ...project,
      // Convert amount from cents to dollars
      amount: project.amount / 100,
    }));

    console.log(project); // Project is an empty array []
    return project[0];
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
        name
      FROM artifacts
      ORDER BY name ASC
    `;

    const artifacts = data.rows;
    return artifacts;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all artifacts.');
  }
}

export async function fetchFilteredArtifacts(query: string) {
  try {
    const data = await sql<ArtifactsTableType>`
		SELECT
		  artifacts.id,
		  artifacts.name,
		  artifacts.email,
		  artifacts.image_url,
		  COUNT(projects.id) AS total_projects,
		  SUM(CASE WHEN projects.status = 'pending' THEN projects.amount ELSE 0 END) AS total_pending,
		  SUM(CASE WHEN projects.status = 'paid' THEN projects.amount ELSE 0 END) AS total_paid
		FROM artifacts
		LEFT JOIN projects ON artifacts.id = projects.artifact_id
		WHERE
		  artifacts.name ILIKE ${`%${query}%`} OR
        artifacts.email ILIKE ${`%${query}%`}
		GROUP BY artifacts.id, artifacts.name, artifacts.email, artifacts.image_url
		ORDER BY artifacts.name ASC
	  `;

    const artifacts = data.rows.map((artifact) => ({
      ...artifact,
      total_pending: formatCurrency(artifact.total_pending),
      total_paid: formatCurrency(artifact.total_paid),
    }));

    return artifacts;
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
