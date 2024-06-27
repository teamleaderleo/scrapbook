// This file contains type definitions for my data.
// It describes the shape of the data, and what data type each property should accept.
// For now, we're manually defining these types.
// However, these types are generated automatically if I'm using an ORM such as Prisma.
export type User = {
  id: string; // Primary key
  name: string;
  email: string;
  password: string; // Consider hashing the password
};

export type Artifact = {
  id: string; // Primary key
  user_id: string; // Foreign key to User.id
  name: string;
  description?: string; // Nullable
  image_url?: string; // Nullable
};

export type Project = {
  id: string; // Primary key
  user_id: string; // Foreign key to User.id
  name: string;
  description?: string; // Nullable
  date: string;
  status: 'pending' | 'completed';
};

export type ProjectArtifact = {
  project_id: string; // Composite primary key part 1
  artifact_id: string; // Composite primary key part 2
};

export type Tag = {
  id: string; // Primary key
  name: string; // Tag name
};

export type ArtifactTag = {
  artifact_id: string; // Composite primary key part 1
  tag_id: string; // Composite primary key part 2
};

export type LatestProject = {
  id: string; // Primary key
  name: string;
  image_url: string;
  description: string;
  date: string;
  user_id: string; // Foreign key to User.id
};

export type ProjectsTable = {
  id: string; // Primary key
  user_id: string; // Foreign key to User.id
  name: string;
  description?: string; // Nullable
  date: string;
  status: 'pending' | 'completed';
  artifacts: Artifact[];
};

export type ArtifactsTableType = {
  id: string; // Primary key
  user_id: string; // Foreign key to User.id
  name: string;
  description?: string; // Nullable
  image_url?: string; // Nullable
  total_projects: number;
  total_pending: number;
  total_completed: number;
};

export type FormattedArtifactsTable = {
  id: string; // Primary key
  user_id: string; // Foreign key to User.id
  name: string;
  description?: string; // Nullable
  image_url?: string; // Nullable
  total_projects: number;
  total_pending: string;
  total_completed: string;
};

export type ArtifactField = {
  id: string; // Primary key
  name: string;
};

export type ProjectForm = {
  id: string; // Primary key
  name: string;
  description?: string; // Nullable
  date: string;
  status: 'pending' | 'completed';
  artifact_ids: string[]; // Array of Foreign keys to Artifact.id
};

// TypeScript definitions for views

// Dashboard view
export type DashboardView = {
  total_users: number;
  total_projects: number;
  total_artifacts: number;
  total_tags: number;
  completed_projects: number;
  pending_projects: number;
  latest_project: {
    id: string;
    name: string;
    date: string;
  };
};

// Tag view
export type TagView = {
  id: string;
  name: string;
  artifact_count: number;
};

// Project view
export type ProjectView = {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  date: string;
  status: 'pending' | 'completed';
  artifact_count: number;
};

// Artifact view
export type ArtifactView = {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  image_url?: string;
  project_count: number;
  tags: string; // This could be an array if I prefer to split the tags on the frontend
};


// Example of sorting and filtering types
export type SortOption = 'date' | 'name' | 'status' | 'numArtifacts' | 'numTags';
export type FilterOption = {
  status?: 'pending' | 'completed';
  tagIds?: string[];
};


// What some of these look like in sql:

// -- Users Table
// CREATE TABLE Users (
//   id UUID PRIMARY KEY,
//   name VARCHAR NOT NULL,
//   email VARCHAR NOT NULL UNIQUE,
//   password VARCHAR NOT NULL
// );

// -- Artifacts Table
// CREATE TABLE Artifacts (
//   id UUID PRIMARY KEY,
//   user_id UUID NOT NULL,
//   name VARCHAR NOT NULL,
//   description TEXT, -- This can be nullable if description is optional
//   image_url VARCHAR, -- Nullable
//   FOREIGN KEY (user_id) REFERENCES Users(id)
// );

// -- Projects Table
// CREATE TABLE Projects (
//   id UUID PRIMARY KEY,
//   user_id UUID NOT NULL,
//   name VARCHAR NOT NULL,
//   description TEXT, -- This can be nullable if description is optional
//   date TIMESTAMP,
//   status VARCHAR CHECK (status IN ('pending', 'completed')) NOT NULL,
//   FOREIGN KEY (user_id) REFERENCES Users(id)
// );

// -- ProjectArtifacts Table
// CREATE TABLE ProjectArtifacts (
//   project_id UUID NOT NULL,
//   artifact_id UUID NOT NULL,
//   PRIMARY KEY (project_id, artifact_id),
//   FOREIGN KEY (project_id) REFERENCES Projects(id),
//   FOREIGN KEY (artifact_id) REFERENCES Artifacts(id)
// );

// -- Tags Table
// CREATE TABLE Tags (
//   id UUID PRIMARY KEY,
//   name VARCHAR NOT NULL UNIQUE
// );

// -- ArtifactTags Table
// CREATE TABLE ArtifactTags (
//   artifact_id UUID NOT NULL,
//   tag_id UUID NOT NULL,
//   PRIMARY KEY (artifact_id, tag_id),
//   FOREIGN KEY (artifact_id) REFERENCES Artifacts(id),
//   FOREIGN KEY (tag_id) REFERENCES Tags(id)
// );
