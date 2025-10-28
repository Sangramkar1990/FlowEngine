const pool = require('../config/database');

class Permission {
  static async create(permissionData) {
    const query = `
      INSERT INTO permissions (name)
      VALUES ($1)
      ON CONFLICT (name) DO NOTHING
      RETURNING id, name, created_at, updated_at;
    `;
    const values = [permissionData.name];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM permissions WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async findByName(name) {
    const query = 'SELECT * FROM permissions WHERE name = $1';
    const result = await pool.query(query, [name]);
    return result.rows[0] || null;
  }

  static async findAll() {
    const query = 'SELECT * FROM permissions';
    const result = await pool.query(query);
    return result.rows;
  }
}

module.exports = Permission;