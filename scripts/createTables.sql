

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  owner_user_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
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
  updated_at TIMESTAMP DEFAULT NULL
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