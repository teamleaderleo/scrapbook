import { sql } from '@vercel/postgres';
import {
  User,
  Artifact,
  ArtifactView,
  LatestArtifact,
  Project,
  ProjectView,
  LatestProject,
  DashboardView,
  
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
        p.userId,
        p.name,
        p.description,
        p.createdAt,
        p.updatedAt,
        p.status,
        COALESCE(
          json_agg(
            json_build_object(
              'id', t.id,
              'name', t.name
            )
          ) FILTER (WHERE t.id IS NOT NULL),
          '[]'
        ) AS tags,
        COALESCE(
          json_agg(
            json_build_object(
              'id', a.id,
              'name', a.name,
              'type', a.type,
              'content', (SELECT content FROM ArtifactContents WHERE artifactId = a.id ORDER BY createdAt DESC LIMIT 1)
            )
          ) FILTER (WHERE a.id IS NOT NULL),
          '[]'
        ) AS artifacts
      FROM Projects p
      LEFT JOIN Tags t ON p.id = t.projectId
      LEFT JOIN ProjectArtifactLinks pal ON p.id = pal.projectId
      LEFT JOIN Artifacts a ON pal.artifactId = a.id
      GROUP BY p.id
      ORDER BY p.updatedAt DESC
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
        p.userId,
        p.name,
        p.description,
        p.createdAt,
        p.updatedAt,
        p.status,
        COALESCE(
          json_agg(
            json_build_object(
              'id', a.id,
              'name', a.name,
              'type', a.type,
              'content', (SELECT content FROM ArtifactContents WHERE artifactId = a.id ORDER BY createdAt DESC LIMIT 1)
            )
          ) FILTER (WHERE a.id IS NOT NULL),
          '[]'
        ) AS artifacts,
        COALESCE(
          json_agg(
            json_build_object(
              'id', t.id,
              'name', t.name
            )
          ) FILTER (WHERE t.id IS NOT NULL),
          '[]'
        ) AS tags,
        COUNT(DISTINCT p.id) OVER() AS totalProjects,
        SUM(CASE WHEN p.status = 'pending' THEN 1 ELSE 0 END) OVER() AS totalPending,
        SUM(CASE WHEN p.status = 'completed' THEN 1 ELSE 0 END) OVER() AS totalCompleted,
        COUNT(DISTINCT t.id) OVER() AS totalTags,
        COUNT(DISTINCT a.id) OVER() AS totalAssociatedArtifacts
      FROM Projects p
      LEFT JOIN ProjectArtifactLinks pal ON p.id = pal.projectId
      LEFT JOIN Artifacts a ON pal.artifactId = a.id
      LEFT JOIN Tags t ON p.id = t.projectId
      WHERE
        p.name ILIKE ${`%${query}%`} OR
        p.description ILIKE ${`%${query}%`} OR
        a.name ILIKE ${`%${query}%`} OR
        t.name ILIKE ${`%${query}%`}
      GROUP BY p.id
      ORDER BY p.updatedAt DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}`;

    return data.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch projects.');
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

export async function fetchLatestArtifacts(limit: number = 5) {
  try {
    const data = await sql<LatestArtifact>`
      SELECT
        a.id,
        a.userId,
        a.name,
        a.type,
        a.description,
        a.createdAt,
        a.updatedAt,
        COALESCE(
          json_agg(
            json_build_object(
              'id', ac.id,
              'type', ac.type,
              'content', ac.content,
              'createdAt', ac.createdAt
            )
          ) FILTER (WHERE ac.id IS NOT NULL),
          '[]'
        ) AS contents,
        COALESCE(
          json_agg(
            json_build_object(
              'id', t.id,
              'name', t.name
            )
          ) FILTER (WHERE t.id IS NOT NULL),
          '[]'
        ) AS tags,
        COALESCE(
          json_agg(
            json_build_object(
              'id', p.id,
              'name', p.name,
              'status', p.status
            )
          ) FILTER (WHERE p.id IS NOT NULL),
          '[]'
        ) AS projects
      FROM Artifacts a
      LEFT JOIN ArtifactContents ac ON a.id = ac.artifactId
      LEFT JOIN Tags t ON a.id = t.artifactId
      LEFT JOIN ProjectArtifactLinks pal ON a.id = pal.artifactId
      LEFT JOIN Projects p ON pal.projectId = p.id
      GROUP BY a.id
      ORDER BY a.updatedAt DESC
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
        a.userId,
        a.name,
        a.type,
        a.description,
        a.createdAt,
        a.updatedAt,
        COALESCE(
          json_agg(
            json_build_object(
              'id', ac.id,
              'type', ac.type,
              'content', ac.content,
              'createdAt', ac.createdAt
            )
          ) FILTER (WHERE ac.id IS NOT NULL),
          '[]'
        ) AS contents,
        COALESCE(
          json_agg(
            json_build_object(
              'id', t.id,
              'name', t.name
            )
          ) FILTER (WHERE t.id IS NOT NULL),
          '[]'
        ) AS tags,
        COALESCE(
          json_agg(
            json_build_object(
              'id', p.id,
              'name', p.name,
              'status', p.status
            )
          ) FILTER (WHERE p.id IS NOT NULL),
          '[]'
        ) AS projects,
        COUNT(DISTINCT a.id) OVER() AS totalArtifacts,
        COUNT(DISTINCT t.id) OVER() AS totalTags,
        COUNT(DISTINCT p.id) OVER() AS totalAssociatedProjects
      FROM Artifacts a
      LEFT JOIN ArtifactContents ac ON a.id = ac.artifactId
      LEFT JOIN ProjectArtifactLinks pal ON a.id = pal.artifactId
      LEFT JOIN Projects p ON pal.projectId = p.id
      LEFT JOIN Tags t ON a.id = t.artifactId
      WHERE
        a.name ILIKE ${`%${query}%`} OR
        a.description ILIKE ${`%${query}%`} OR
        ac.content ILIKE ${`%${query}%`} OR
        t.name ILIKE ${`%${query}%`}
      GROUP BY a.id
      ORDER BY a.updatedAt DESC`;

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

export async function fetchDashboardData(userId: string) {
  try {
    const data = await sql<DashboardView>`
      SELECT
        ${userId} AS userId,
        (SELECT COUNT(*) FROM Users) AS totalUsers,
        (SELECT COUNT(*) FROM Projects) AS totalProjects,
        (SELECT COUNT(*) FROM Artifacts) AS totalArtifacts,
        (SELECT COUNT(*) FROM Tags) AS totalTags,
        (SELECT COUNT(*) FROM Projects WHERE status = 'completed') AS completedProjects,
        (SELECT COUNT(*) FROM Projects WHERE status = 'pending') AS pendingProjects
    `;

    return data.rows[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch dashboard data.');
  }
}
