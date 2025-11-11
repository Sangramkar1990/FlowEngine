const pool = require('../config/database');

class Role {
  static async create(roleData) {
    const query = `
      INSERT INTO roles (name, organization_id)
      VALUES ($1, $2)
      ON CONFLICT (name, organization_id) DO NOTHING
      RETURNING id, name, organization_id, created_at, updated_at;
    `;
    const values = [roleData.name, roleData.organizationId || null];
    console.log("Creating role with values:", values);
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM roles WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  

  static async findByName(name, organizationId = null) {
    let query;
    let values;
    if (organizationId !== null) {
      query = 'SELECT * FROM roles WHERE name = $1 AND organization_id = $2';
      values = [name, organizationId];
    } else {
      query = 'SELECT * FROM roles WHERE name = $1 AND organization_id IS NULL';
      values = [name];
    }
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async findAll(organizationId = null) {
    let query = 'SELECT * FROM roles';
    let values = [];
    if (organizationId !== null) {
      query += ' WHERE organization_id = $1';
      values.push(organizationId);
    } else {
      query += ' WHERE organization_id IS NULL'; // Ensure we only get global roles if organizationId is null
    }
    const result = await pool.query(query, values);
    return result.rows;
  }

  // static async findAll(organizationId = null) {
  //   let query = 'SELECT * FROM roles';
  //   let values = [];
  //   if (organizationId !== null) {
  //     query += ' WHERE organization_id = $1';
  //     values.push(organizationId);
  //   } else {
  //     query += ' WHERE organization_id IS NULL'; // Ensure we only get global roles if organizationId is null
  //   }
  //   const result = await pool.query(query, values);
  //   return result.rows;
  // }

  /**
   * Finds roles for a given organization ID. If no roles are found,
   * it creates default 'user', 'team lead', and 'admin' roles for that organization.
   * @param {number} organizationId - The ID of the organization.
   * @returns {Promise<Array>} - An array of role objects for the specified organization.
   */
  static async findOrCreateDefaultRoles(organizationId) {
    let roles = await this.findAll(organizationId);

    if (roles.length === 0) {
      console.log(`No roles found for organization ID ${organizationId}. Creating default roles...`);
      const defaultRoleNames = ['user', 'team lead', 'admin'];
      const createdRoles = [];

      for (const roleName of defaultRoleNames) {
        const newRole = await this.create({ name: roleName, organizationId: organizationId });
        if (newRole) {
          createdRoles.push(newRole);
        }
      }
      console.log(`Default roles created for organization ID ${organizationId}.`);
      return createdRoles; // Return the newly created roles
    }

    return roles; // Return existing roles
  }
}

module.exports = Role;