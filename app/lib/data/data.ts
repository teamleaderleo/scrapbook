import { sql } from '@vercel/postgres';
import {
  Account,
  ProjectView,
  ProjectWithRelations,
  DashboardView,
  Tag
} from '../definitions';

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
