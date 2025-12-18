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



-- -- Step 2: Populate existing rows with unique public_ids
-- UPDATE organizations
-- SET public_id = gen_random_uuid()::text;

-- -- Step 3: Add UNIQUE constraint
-- ALTER TABLE organizations ADD CONSTRAINT organizations_public_id_key UNIQUE (public_id);

-- Step 4: Alter the column to be NOT NULL
-- ALTER TABLE organizations ALTER COLUMN public_id SET NOT NULL;

-- Users table
-- CREATE TABLE IF NOT EXISTS users (
--   id SERIAL PRIMARY KEY,
--   name VARCHAR(255) NOT NULL,
--   email VARCHAR(255) UNIQUE NOT NULL,
--   password VARCHAR(255) NOT NULL,
--   date_of_birth DATE,
--   rank VARCHAR(50),
--   user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('user', 'lead', 'admin', 'superAdmin')),
--   organization_name VARCHAR(255),
--   organization_id INTEGER REFERENCES organizations(id),
--   role_id INTEGER REFERENCES roles(id) DEFAULT (SELECT id FROM roles WHERE name = 'user'),
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );
-- -- Only add the column if it doesn't already exists
--     ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
-- Invite lists table
-- CREATE TABLE IF NOT EXISTS invite_lists (
--   id SERIAL PRIMARY KEY,
--   organization_id INTEGER REFERENCES organizations(id),
--   emails TEXT[] NOT NULL,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- Sequences table
-- CREATE TABLE IF NOT EXISTS sequences (
--   id SERIAL PRIMARY KEY,
--   name VARCHAR(255) NOT NULL,
--   description TEXT,
--   user_id INTEGER REFERENCES users(id),
--   user_name VARCHAR(255),
--   cards JSONB,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- Cards table
-- CREATE TABLE IF NOT EXISTS cards (
--   id SERIAL PRIMARY KEY,
--   name VARCHAR(255) NOT NULL,
--   description TEXT,
--   url VARCHAR(500),
--   type VARCHAR(100),
--   effect TEXT,
--   effective TEXT,
--   user_id INTEGER REFERENCES users(id),
--   user_name VARCHAR(255),
--   sequence_id INTEGER REFERENCES sequences(id),
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- CREATE TABLE IF NOT EXISTS invite_requests (
--   id SERIAL PRIMARY KEY,
--   organization_id INTEGER REFERENCES organizations(id),
--   user_id INTEGER REFERENCES users(id),
--   status INTEGER DEFAULT 1,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- CREATE TABLE IF NOT EXISTS memberships (
--   id SERIAL PRIMARY KEY,
--   user_id INTEGER REFERENCES users(id),
--   organization_id INTEGER REFERENCES organizations(id),
--   role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'teamleader')),
--   joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );


-- CREATE TABLE IF NOT EXISTS teams (
--     id SERIAL PRIMARY KEY,
--     name VARCHAR(255) NOT NULL,
--     organization_id INTEGER REFERENCES organizations(id),
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );


-- CREATE TABLE IF NOT EXISTS team_members (
--     id SERIAL PRIMARY KEY,
--     team_id INTEGER REFERENCES teams(id),
--     membership_id INTEGER REFERENCES memberships(id),
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     UNIQUE (team_id, membership_id)
-- );

-- CREATE TABLE IF NOT EXISTS shares (
--   id SERIAL PRIMARY KEY,
--   sequence_id INTEGER UNIQUE REFERENCES sequences(id) ON DELETE CASCADE,
--   name VARCHAR(255) NOT NULL,
--   entire_org BOOLEAN DEFAULT TRUE,
--   organization_id INTEGER REFERENCES organizations(id),
--   team_ids INTEGER[],
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  organization_id INTEGER REFERENCES organizations(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (name, organization_id) -- This will only apply if the table is newly created
);

-- Drop the old unique constraint on 'name' if it exists, as we are moving to a composite unique key
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'roles_name_key' AND conrelid = 'roles'::regclass) THEN
        ALTER TABLE roles DROP CONSTRAINT roles_name_key;
    END IF;
END
$$;

-- Ensure organization_id column exists if table was created without it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='roles' AND column_name='organization_id') THEN
        ALTER TABLE roles ADD COLUMN organization_id INTEGER REFERENCES organizations(id);
    END IF;
END
$$;

-- Ensure the composite unique constraint exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'roles_name_organization_id_key' AND conrelid = 'roles'::regclass) THEN
        ALTER TABLE roles ADD CONSTRAINT roles_name_organization_id_key UNIQUE (name, organization_id);
    END IF;
END
$$;

-- INSERT INTO roles (name, organization_id) VALUES
-- ('user', NULL),
-- ('team lead', NULL),
-- ('admin', NULL),
-- ('super admin', NULL)
-- ON CONFLICT (name, organization_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO permissions (name) VALUES
('view_sequence'),
('manage_sequence'),
('share_sequence'),
('view_teams'),
('manage_teams'),
('view_techniques'),
('manage_techniques'),
('view_organization'),
('manage_organization')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  permission_ids INTEGER[] NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (role_id)
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  date_of_birth DATE,
  rank VARCHAR(50),
  organization_name VARCHAR(255),
  organization_id INTEGER REFERENCES organizations(id),
  role_id INTEGER REFERENCES roles(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Only add the column if it doesn't already exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(id);

-- Insert default role permissions
DO $$
DECLARE
    user_role_id INTEGER;
    team_lead_role_id INTEGER;
    admin_role_id INTEGER;
    super_admin_role_id INTEGER;
    view_sequence_perm_id INTEGER;
    manage_sequence_perm_id INTEGER;
    share_sequence_perm_id INTEGER;
    view_teams_perm_id INTEGER;
    manage_teams_perm_id INTEGER;
    view_techniques_perm_id INTEGER;
    manage_techniques_perm_id INTEGER;
    view_organization_perm_id INTEGER;
    manage_organization_perm_id INTEGER;
BEGIN
    SELECT id INTO user_role_id FROM roles WHERE name = 'user';
    SELECT id INTO team_lead_role_id FROM roles WHERE name = 'team lead';
    SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
    SELECT id INTO super_admin_role_id FROM roles WHERE name = 'super admin';

    SELECT id INTO view_sequence_perm_id FROM permissions WHERE name = 'view_sequence';
    SELECT id INTO manage_sequence_perm_id FROM permissions WHERE name = 'manage_sequence';
    SELECT id INTO share_sequence_perm_id FROM permissions WHERE name = 'share_sequence';
    SELECT id INTO view_teams_perm_id FROM permissions WHERE name = 'view_teams';
    SELECT id INTO manage_teams_perm_id FROM permissions WHERE name = 'manage_teams';
    SELECT id INTO view_techniques_perm_id FROM permissions WHERE name = 'view_techniques';
    SELECT id INTO manage_techniques_perm_id FROM permissions WHERE name = 'manage_techniques';
    SELECT id INTO view_organization_perm_id FROM permissions WHERE name = 'view_organization';
    SELECT id INTO manage_organization_perm_id FROM permissions WHERE name = 'manage_organization';

    -- User role permissions
    INSERT INTO role_permissions (role_id, permission_ids) VALUES
    (user_role_id, ARRAY[view_sequence_perm_id, view_techniques_perm_id, view_teams_perm_id, view_organization_perm_id])
    ON CONFLICT (role_id) DO UPDATE SET permission_ids = EXCLUDED.permission_ids;

    -- Team Lead role permissions
    INSERT INTO role_permissions (role_id, permission_ids) VALUES
    (team_lead_role_id, ARRAY[view_sequence_perm_id, view_techniques_perm_id, view_teams_perm_id, view_organization_perm_id, manage_sequence_perm_id, manage_teams_perm_id, share_sequence_perm_id])
    ON CONFLICT (role_id) DO UPDATE SET permission_ids = EXCLUDED.permission_ids;

    -- Admin role permissions
    INSERT INTO role_permissions (role_id, permission_ids) VALUES
    (admin_role_id, ARRAY[view_sequence_perm_id, view_techniques_perm_id, view_teams_perm_id, view_organization_perm_id, manage_sequence_perm_id, manage_teams_perm_id, share_sequence_perm_id, manage_organization_perm_id])
    ON CONFLICT (role_id) DO UPDATE SET permission_ids = EXCLUDED.permission_ids;

    -- Super Admin role permissions (all permissions)
    INSERT INTO role_permissions (role_id, permission_ids) VALUES
    (super_admin_role_id, ARRAY[view_sequence_perm_id, manage_sequence_perm_id, share_sequence_perm_id, view_teams_perm_id, manage_teams_perm_id, view_techniques_perm_id, manage_techniques_perm_id, view_organization_perm_id, manage_organization_perm_id])
    ON CONFLICT (role_id) DO UPDATE SET permission_ids = EXCLUDED.permission_ids;

    -- Set default role for existing users if role_id is NULL
    UPDATE users
    SET role_id = user_role_id
    WHERE role_id IS NULL;

END $$;

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
  role INTEGER REFERENCES roles(id),
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

CREATE TABLE IF NOT EXISTS shares (
  id SERIAL PRIMARY KEY,
  sequence_id TEXT UNIQUE ,
  name VARCHAR(255) NOT NULL,
  entire_org BOOLEAN DEFAULT TRUE,
  organization_id INTEGER REFERENCES organizations(id),
  team_ids INTEGER[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);