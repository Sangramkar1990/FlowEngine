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
    }
    const result = await pool.query(query, values);
    return result.rows;
  }
}

module.exports = Role;