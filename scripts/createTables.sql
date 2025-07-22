

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  owner_user_id INTEGER NOT NULL,
  public_id VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Enable pgcrypto extension (only needs to be done once per database)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Step 1: Add column as nullable
ALTER TABLE organizations ADD COLUMN public_id VARCHAR(255);

-- Step 2: Populate existing rows with unique public_ids
UPDATE organizations
SET public_id = gen_random_uuid()::text;

-- Step 3: Add UNIQUE constraint
ALTER TABLE organizations ADD CONSTRAINT organizations_public_id_key UNIQUE (public_id);

-- Step 4: Alter the column to be NOT NULL
ALTER TABLE organizations ALTER COLUMN public_id SET NOT NULL;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  date_of_birth DATE,
  rank VARCHAR(50),
  user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('user', 'lead', 'admin', 'superAdmin')),
  organization_name VARCHAR(255),
  organization_id INTEGER REFERENCES organizations(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Only add the column if it doesn't already exists
    ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
-- Invite lists table
CREATE TABLE IF NOT EXISTS invite_lists (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id),
  emails TEXT[] NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sequences table
CREATE TABLE IF NOT EXISTS sequences (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  user_id INTEGER REFERENCES users(id),
  user_name VARCHAR(255),
  cards JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cards table
CREATE TABLE IF NOT EXISTS cards (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  url VARCHAR(500),
  type VARCHAR(100),
  effect TEXT,
  effective TEXT,
  user_id INTEGER REFERENCES users(id),
  user_name VARCHAR(255),
  sequence_id INTEGER REFERENCES sequences(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invite_requests (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER REFERENCES organizations(id),
  user_id INTEGER REFERENCES users(id),
  status INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS memberships (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  organization_id INTEGER REFERENCES organizations(id),
  role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'teamleader')),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    organization_id INTEGER REFERENCES organizations(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS team_members (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id),
    membership_id INTEGER REFERENCES memberships(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (team_id, membership_id)
);