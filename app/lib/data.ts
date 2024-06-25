import { sql } from '@vercel/postgres';
import {
  CustomerField,
  CustomersTableType,
  ProjectForm,
  ProjectsTable,
  LatestProjectRaw,
  User,
  Revenue,
} from './definitions';
import { formatCurrency } from './utils';

export async function fetchRevenue() {
  // Add noStore() here to prevent the response from being cached.
  // This is equivalent to in fetch(..., {cache: 'no-store'}).

  try {
    // Artificially delay a response for demo purposes.
    // Don't do this in production :)

    // console.log('Fetching revenue data...');
    // await new Promise((resolve) => setTimeout(resolve, 3000));

    const data = await sql<Revenue>`SELECT * FROM revenue`;

    // console.log('Data fetch completed after 3 seconds.');

    return data.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestProjects() {
  try {
    const data = await sql<LatestProjectRaw>`
      SELECT projects.amount, customers.name, customers.image_url, customers.email, projects.id
      FROM projects
      JOIN customers ON projects.customer_id = customers.id
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
    const customerCountPromise = sql`SELECT COUNT(*) FROM customers`;
    const projectStatusPromise = sql`SELECT
         SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS "paid",
         SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
         FROM projects`;

    const data = await Promise.all([
      projectCountPromise,
      customerCountPromise,
      projectStatusPromise,
    ]);

    const numberOfProjects = Number(data[0].rows[0].count ?? '0');
    const numberOfCustomers = Number(data[1].rows[0].count ?? '0');
    const totalPaidProjects = formatCurrency(data[2].rows[0].paid ?? '0');
    const totalPendingProjects = formatCurrency(data[2].rows[0].pending ?? '0');

    return {
      numberOfCustomers,
      numberOfProjects,
      totalPaidProjects,
      totalPendingProjects,
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
        customers.name,
        customers.email,
        customers.image_url
      FROM projects
      JOIN customers ON projects.customer_id = customers.id
      WHERE
        customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`} OR
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
    JOIN customers ON projects.customer_id = customers.id
    WHERE
      customers.name ILIKE ${`%${query}%`} OR
      customers.email ILIKE ${`%${query}%`} OR
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
        projects.customer_id,
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

export async function fetchCustomers() {
  try {
    const data = await sql<CustomerField>`
      SELECT
        id,
        name
      FROM customers
      ORDER BY name ASC
    `;

    const customers = data.rows;
    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}

export async function fetchFilteredCustomers(query: string) {
  try {
    const data = await sql<CustomersTableType>`
		SELECT
		  customers.id,
		  customers.name,
		  customers.email,
		  customers.image_url,
		  COUNT(projects.id) AS total_projects,
		  SUM(CASE WHEN projects.status = 'pending' THEN projects.amount ELSE 0 END) AS total_pending,
		  SUM(CASE WHEN projects.status = 'paid' THEN projects.amount ELSE 0 END) AS total_paid
		FROM customers
		LEFT JOIN projects ON customers.id = projects.customer_id
		WHERE
		  customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`}
		GROUP BY customers.id, customers.name, customers.email, customers.image_url
		ORDER BY customers.name ASC
	  `;

    const customers = data.rows.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
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
