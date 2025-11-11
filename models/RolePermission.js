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

   static async findAll() {
    const query = 'SELECT * FROM role_permissions';
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Inserts or updates a role-permission mapping.
   * This method leverages the ON CONFLICT clause in the create method.
   * @param {object} values - The values to insert or update (e.g., { role_id: 1, permission_ids: [1, 2] }).
   * @param {object} options - Options for the upsert operation (e.g., { where: { role_id: 1 } }).
   * @returns {Promise<object>} - The inserted or updated role-permission object.
   */
  static async upsert(values, options) {
    // The existing create method already handles the ON CONFLICT for role_id,
    // so we can directly call it with the provided values.
    // The 'options.where' parameter is implicitly handled by the SQL's ON CONFLICT clause.
    return this.create(values);
  }
  /**
   * Assigns permissions from global roles (role_id 1, 2, 3) to new organization-specific roles.
   * @param {Array<number>} newRoleIds - An array containing three new role IDs for user, team lead, and admin.
   * @returns {Promise<boolean>} - True if permissions are successfully assigned.
   */
  static async assignNewRolePermissonOrg(newRoleIds) {
    if (!Array.isArray(newRoleIds) || newRoleIds.length !== 3) {
      throw new Error("newRoleIds must be an array of 3 role IDs.");
    }

    // Get permissions for global roles (assuming role_id 1, 2, 3 are global user, team lead, admin respectively)
    const globalUserRolePermissions = await this.findByRoleId(1);
    const globalTeamLeadRolePermissions = await this.findByRoleId(2);
    const globalAdminRolePermissions = await this.findByRoleId(3);

    // Assign permissions to the new organization's roles
    if (globalUserRolePermissions) {
      await this.upsert({
        role_id: newRoleIds[0], // New user role
        permission_ids: globalUserRolePermissions.permission_ids,
      });
    }
    if (globalTeamLeadRolePermissions) {
      await this.upsert({
        role_id: newRoleIds[1], // New team lead role
        permission_ids: globalTeamLeadRolePermissions.permission_ids,
      });
    }
    if (globalAdminRolePermissions) {
      await this.upsert({
        role_id: newRoleIds[2], // New admin role
        permission_ids: globalAdminRolePermissions.permission_ids,
      });
    }

    return true;
  }

}

module.exports = RolePermission;