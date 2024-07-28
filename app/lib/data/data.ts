import { sql } from '@vercel/postgres';
import {
  Account,
  DashboardView,
  Tag
} from '../definitions';
import {
  ProjectView,
  ProjectWithArtifacts
} from "../definitions/project-definitions";

export async function getAccount(email: string) {
  try {
    const account = await sql`SELECT * FROM account WHERE email=${email}`;
    return account.rows[0] as Account;
  } catch (error) {
    console.error('Failed to fetch account:', error);
    throw new Error('Failed to fetch account.');
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
