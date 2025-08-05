const pool = require("../config/database");
// const Organization = require('./Organization'); // This line is no longer needed

class Membership {
  static async create(userId, organizationId, role) {
    const query = `
      INSERT INTO memberships (user_id, organization_id, role)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await pool.query(query, [userId, organizationId, role]);
    // console.log(result);
    return result.rows[0];
  }

  static async findByUserId(userId) {
    // const query = `
    //   SELECT m.*, o.name as organization_name
    //   FROM memberships m
    //   LEFT JOIN organizations o ON m.organization_id = o.id
    //   WHERE m.user_id = $1
    // `;
    const query = `SELECT m.*, o.name AS organization_name
FROM memberships m
LEFT JOIN organizations o ON m.organization_id = o.id;`;
    // const result = await pool.query(query, [userId]);
    const result = await pool.query(query);
    // console.log(result.rows);

    return result.rows;
  }

  static async findByOrganizationId(organizationId) {
    const query = "SELECT * FROM memberships WHERE organization_id = $1";
    const result = await pool.query(query, [organizationId]);
    return result.rows;
  }

  static async updateRole(membershipId, newRole) {
    // console.log("Updating membership role:", { membershipId, newRole });
    const query = `
      UPDATE memberships
      SET role = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [newRole, membershipId]);
    // console.log("Updated membership:", result.rows[0]);
    return result.rows[0];
  }

  static async delete(membershipId) {
    const query = "DELETE FROM memberships WHERE id = $1 RETURNING *";
    const result = await pool.query(query, [membershipId]);
    return result.rows[0];
  }

  static async searchByUserNameOrEmail(query) {
    const sql = `SELECT m.*, u.name, u.email, u.user_type FROM memberships m
      JOIN users u ON m.user_id = u.id
      WHERE LOWER(u.name) LIKE LOWER($1) OR LOWER(u.email) LIKE LOWER($1)`;
    const result = await pool.query(sql, [`%${query}%`]);
    return result.rows;
  }

  // Get all memberships with user data
  static async findAllWithUser() {
    const query = `SELECT m.*, u.name, u.email, u.user_type FROM memberships m JOIN users u ON m.user_id = u.id`;
    const result = await pool.query(query);
    return result.rows;
  }
}

module.exports = Membership;
