const pool = require('../config/database');
const Permission = require('./Permission'); // Needed to fetch permission names

class RolePermission {
  static async create(rolePermissionData) {
    const query = `
      INSERT INTO role_permissions (role_id, permission_ids)
      VALUES ($1, $2)
      ON CONFLICT (role_id) DO UPDATE SET permission_ids = EXCLUDED.permission_ids, updated_at = CURRENT_TIMESTAMP
      RETURNING id, role_id, permission_ids, created_at, updated_at;
    `;
    const values = [rolePermissionData.role_id, rolePermissionData.permission_ids];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByRoleId(roleId) {
    const query = 'SELECT * FROM role_permissions WHERE role_id = $1';
    const result = await pool.query(query, [roleId]);
    return result.rows[0] || null;
  }

  static async getPermissionsForRole(roleId) {
    const query = `
      SELECT p.name
      FROM permissions p
      JOIN role_permissions rp ON p.id = ANY(rp.permission_ids)
      WHERE rp.role_id = $1;
    `;
    const result = await pool.query(query, [roleId]);
    return result.rows.map(row => row.name);
  }
}

module.exports = RolePermission;