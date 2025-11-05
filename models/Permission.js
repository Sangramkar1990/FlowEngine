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

  /**
   * Finds a permission by criteria, or creates it if it doesn't exist.
   * @param {object} options - Options object.
   * @param {object} options.where - Criteria to find the permission (e.g., { name: 'permission_name' }).
   * @param {object} options.defaults - Default values to use if the permission needs to be created.
   * @returns {Promise<Array>} - An array containing the permission object and a boolean indicating if it was created.
   */
  static async findOrCreate({ where, defaults }) {
    let permission = await this.findByName(where.name);
    let created = false;

    if (!permission) {
      permission = await this.create(defaults);
      created = true;
    }

    return [permission, created];
  }
}

module.exports = Permission;